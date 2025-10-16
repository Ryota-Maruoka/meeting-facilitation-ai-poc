"""バックエンドアプリケーションのエントリーポイント

サブコマンド:
  server: FastAPIサーバーを起動
  summarize-meeting: 会議ASRテキストから要約を生成
"""

import uvicorn
import typer

app = typer.Typer(help="Meeting Facilitation AI PoC Backend")


@app.command()
def server(
    host: str = typer.Option("0.0.0.0", help="バインドホスト"),
    port: int = typer.Option(8000, help="バインドポート"),
    reload: bool = typer.Option(True, help="自動リロード"),
):
    """FastAPIサーバーを起動する"""
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)


@app.command(name="summarize-meeting")
def summarize_meeting_command(
    file: str = typer.Option(None, "--file", "-f", help="ASRテキストファイルのパス"),
    output: str = typer.Option(None, "--output", "-o", help="出力先ファイルパス"),
    format: str = typer.Option("json", "--format", help="出力形式（json/markdown）"),
    keep_noise: bool = typer.Option(False, "--keep-noise", help="フィラー削除を弱める"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="詳細ログを表示"),
):
    """会議ASRテキストから要約を生成する
    
    使用例:
      python run.py summarize-meeting --file ./transcript.txt --output ./data/meetings/summary.json
      python run.py summarize-meeting --file ./transcript.txt --output ./data/meetings/summary.md --format markdown
      cat transcript.txt | python run.py summarize-meeting --format markdown
    """
    from pathlib import Path
    from app.meeting_summarizer.cli import main as cli_main
    import sys
    
    # typer.Contextを使わずに直接引数を処理
    file_path = Path(file) if file else None
    output_path = Path(output) if output else None
    
    # CLIコマンドを実行
    try:
        cli_main(file=file_path, output=output_path, format=format, keep_noise=keep_noise, verbose=verbose)
    except typer.Exit:
        sys.exit(1)


if __name__ == "__main__":
    app()
