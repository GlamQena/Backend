const userModel = require("../../models/users/user");

const updatePreferences = async (req, res) => {
  try {
    const user_id = req.user.id;

    const updates = {};
    const { theme, locale } = req.body;

    if (theme !== undefined) {
      if (typeof theme !== "string") {
        return res.status(400).json({ success: false, message: "theme must be a string" });
      }
      const value = theme.trim().toLowerCase();
      if (!["light", "dark", "system"].includes(value)) {
        return res.status(400).json({
          success: false,
          message: `theme must be one of: light, dark, system`,
        });
      }
      updates["preferences.theme"] = value;
    }

    if (locale !== undefined) {
      if (typeof locale !== "string") {
        return res.status(400).json({ success: false, message: "locale must be a string" });
      }
      const value = locale.trim().toLowerCase();
      if (!["ar", "en"].includes(value)) {
        return res.status(400).json({
          success: false,
          message: `locale must be either 'ar' or 'en'`,
        });
      }
      updates["preferences.locale"] = value;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "no preference fields provided" });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      user_id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("preferences");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "user not found" });
    }

    return res.status(200).json({
      success: true,
      message: "preferences updated",
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    console.error("error updating preferences:", error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

module.exports = updatePreferences;