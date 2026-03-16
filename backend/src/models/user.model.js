import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Never returned by default in queries
    },

    phone: {
      type: String,
    },

    role: {
      type: String,
      enum: ["customer", "admin", "pharmacist"],
      default: "customer",
    },

    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [150, "Age seems unrealistic"],
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    allergies: [
      {
        allergen: {
          type: String,
          required: true,
          trim: true,
          lowercase: true, // Standardize for easier matching
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        reaction: {
          type: String, // e.g., "Hives", "Shortness of breath"
          trim: true,
        },
      },
    ],
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords
// Guard: if the stored password is undefined (legacy user without password), return false
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    // Legacy or malformed hash should fail auth, not crash the request.
    return false;
  }
};

export default mongoose.model("User", userSchema);
