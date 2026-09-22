const EMAIL_PALETTES = {
  // Light — mirrors :root[data-theme="pink"]
  light: {
    // Backgrounds
    bgPage:          "#fff8fb",
    bgCard:          "#ffffff",
    bgInput:         "#fdf0f6",

    // Accent
    primaryMain:     "#ff69b4",
    primaryStrong:   "#ff479d",
    primaryGradient: "linear-gradient(135deg, #ff69b4, #ff8da1)",
    primaryGradientHover: "linear-gradient(135deg, #ff52a5, #ff758d)",

    // Text
    textPrimary:     "#251030",
    textSecondary:   "#68487a",
    textMuted:       "#a084b3",

    // Borders
    borderProminent: "rgba(255, 105, 180, 0.25)",
    borderSubtle:    "rgba(255, 105, 180, 0.10)",

    // Status
    successGradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    successText:     "#ffffff",

    // Warning / danger
    dangerBg:        "rgba(239, 68, 68, 0.08)",
    dangerBorder:    "#ff69b4",
    dangerText:      "#ff69b4",

    // Button
    buttonText:      "#ffffff",
  },

  // Dark — mirrors :root[data-theme="purple"]
  dark: {
    // Backgrounds
    bgPage:          "#07040f",
    bgCard:          "#1c0a2b",
    bgInput:         "#0e0516",

    // Accent
    primaryMain:     "#a855f7",
    primaryStrong:   "#c084fc",
    primaryGradient: "linear-gradient(135deg, #7e00a6)",
    primaryGradientHover: "linear-gradient(135deg, #9200c2)",

    // Text
    textPrimary:     "#f8f7fa",
    textSecondary:   "#cbaedc",
    textMuted:       "#79578c",

    // Borders
    borderProminent: "rgba(126, 0, 166, 0.25)",
    borderSubtle:    "rgba(126, 0, 166, 0.10)",

    // Status
    successGradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    successText:     "#ffffff",

    // Warning / danger
    dangerBg:        "rgba(239, 68, 68, 0.10)",
    dangerBorder:    "#ef4444",
    dangerText:      "#ef4444",

    // Button
    buttonText:      "#ffffff",
  },
};

function resolveEmailPalette(preference) {
  return preference === "dark" ? EMAIL_PALETTES.dark : EMAIL_PALETTES.light;
}

module.exports = { EMAIL_PALETTES, resolveEmailPalette };