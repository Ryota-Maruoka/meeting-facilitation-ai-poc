/**
 * MUI テーマ設定
 * 
 * アプリケーション全体のテーマを定義
 */

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb", // より鮮やかなブルー
      light: "#3b82f6",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#7c3aed", // パープル
      light: "#8b5cf6",
      dark: "#6d28d9",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#ffffff",
    },
    info: {
      main: "#06b6d4",
      light: "#22d3ee",
      dark: "#0891b2",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc", // より明るいグレー
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.43,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
        contained: {
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});
