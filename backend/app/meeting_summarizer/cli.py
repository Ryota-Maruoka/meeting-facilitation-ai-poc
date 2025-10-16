"""会議要約CLIコマンド

使用例:
  python -m app.meeting_summarizer.cli --file ./transcript.txt
  cat transcript.txt | python -m app.meeting_summarizer.cli --format markdown
"""

import sys
import logging
from pathlib import Path
from typing import Optional, Literal

import typer

from .service import summarize_meeting
from .presenter import format_summary

app = typer.Typer(help="会議ASRテキストから要約を生成")

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@app.command()
def main(
    file: Optional[Path] = typer.Option(
        None,
        "--file",
        "-f",
        help="ASRテキストファイルのパス（未指定時はSTDINから読み込み）"
    ),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help="出力先ファイルパス（未指定時は標準出力）"
    ),
    format: Literal["json", "markdown"] = typer.Option(
        "json",
        "--format",
        help="出力形式（json または markdown）"
    ),
    keep_noise: bool = typer.Option(
        False,
        "--keep-noise",
        help="フィラー削除を弱める（原文優先）"
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="詳細ログを表示"
    )
):
    """会議ASRテキストから要約を生成する
    
    ファイルまたは標準入力からASRテキストを読み込み、
    Azure OpenAI APIを使用して会議要約を生成します。
    
    出力形式:
      - json: 厳格なJSON（summary/decisions/undecided/actions）
      - markdown: 4セクション構成のMarkdown
    
    環境変数:
      AZURE_OPENAI_ENDPOINT: Azure OpenAIエンドポイント
      AZURE_OPENAI_API_KEY: APIキー
      AZURE_OPENAI_DEPLOYMENT: デプロイ/モデル名（例: gpt-4o-mini）
      DEFAULT_TIMEZONE: タイムゾーン（例: Asia/Tokyo）
    """
    # ロギングレベル設定
    if verbose:
        logging.getLogger("app.meeting_summarizer").setLevel(logging.INFO)
    else:
        logging.getLogger("app.meeting_summarizer").setLevel(logging.WARNING)
    
    try:
        # 入力読み込み
        if file:
            if not file.exists():
                typer.echo(f"エラー: ファイルが見つかりません: {file}", err=True)
                raise typer.Exit(code=1)
            if verbose:
                typer.echo(f"ファイルから読み込み: {file}", err=True)
            asr_text = file.read_text(encoding="utf-8")
        else:
            if verbose:
                typer.echo("標準入力から読み込み中...", err=True)
            asr_text = sys.stdin.read()
        
        if not asr_text.strip():
            typer.echo("エラー: ASRテキストが空です", err=True)
            raise typer.Exit(code=1)
        
        # 要約生成
        if verbose:
            typer.echo("要約生成中...", err=True)
        
        summary = summarize_meeting(
            asr_text=asr_text,
            keep_noise=keep_noise,
            use_fallback=True,
            verbose=verbose
        )
        
        # 出力整形
        output_text = format_summary(summary, format_type=format)
        
        # 出力先に応じて処理
        if output:
            # ファイルに保存
            output_path = Path(output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(output_text, encoding="utf-8")
            
            if verbose:
                typer.echo(f"✅ 要約を保存しました: {output_path}", err=True)
            else:
                typer.echo(f"保存完了: {output_path}")
        else:
            # 標準出力へ出力
            typer.echo(output_text)
            
            if verbose:
                typer.echo("\n✅ 要約生成完了", err=True)
        
    except ValueError as e:
        typer.echo(f"エラー: {e}", err=True)
        raise typer.Exit(code=1)
    except Exception as e:
        typer.echo(f"予期しないエラー: {e}", err=True)
        if verbose:
            logger.exception("詳細:")
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()


