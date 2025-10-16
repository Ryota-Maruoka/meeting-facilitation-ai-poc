"use client";

import { FC, ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/styles/theme";

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * MUIテーマプロバイダー
 * 
 * クライアントサイドでMUIテーマを提供する
 * 
 * @param props - コンポーネントのプロパティ
 * @returns テーマプロバイダーの JSX 要素
 */
const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
