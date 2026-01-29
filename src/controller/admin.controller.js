const { User, Institution, Student, Course } = require("../model/model.js")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { passwordGenerator } = require("../helper/PasswordGenerator.js")
const { AdminRegisterSchema, AdminLoginSchema, institutionSchema } = require("../schema/Schema.js");
const uploadSingleImage = require("../helper/upload.js");
const sendPasswordEmail = require("../helper/mail.service.js")

const registerAdmin = async (req, res) => {
  try {
    const parsedData = AdminRegisterSchema.parse(req.body);
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists. Only one admin is allowed.",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(parsedData.password, salt);
    const user = new User({ email: parsedData.email, password: hashedPassword, role: "admin" });
    await user.save();

    return res.status(201).json({ message: "Admin registered successfully", user });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error("Create student error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });

  }
};



const loginAdmin = async (req, res) => {
  try {
    const parsedData = AdminLoginSchema.parse(req.body);
    const admin = await User.findOne({ email: parsedData.email, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }


    const isMatch = await bcrypt.compare(parsedData.password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const text = process.env.TOKEN_SECRET
    console.log("tokend", text)
    const token = jwt.sign(
      {
        userId: admin._id,
        role: admin.role,
        email: admin.email,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    console.log(token)
    res.cookie('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    })

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in admin", error });
  }
};



const adminLogOut = async (req, res) => {
  try {
    const adminId = req.user?._id;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can logout" });
    }


    res.clearCookie("admin-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Admin logged out successfully",
    });

  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


const GetAdminProfile = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await User.findById(adminId).select("-password");
    return res.status(200).json({ message: "Admin profile fetched successfully", admin });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching admin profile", error });
  }
}



const addInstitution = async (req, res) => {
  try {
    const { lat, lng, ...body } = req.body;

    const parsedData = institutionSchema.parse(body);


    if (!lat || !lng) {
      return res.status(400).json({ message: "Location is required" });
    }

    if (!req.files?.photo?.[0]) {
      return res.status(400).json({ message: "Image is requrird is required" })
    }

    const adminId = req.user?._id;
    if (!adminId) {
      return res.status(403).json({ message: "Only admins can add institutions" });
    }

    const isAdmin = await User.findById(adminId);
    if (!isAdmin || isAdmin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add institutions" });
    }


    const photoFile = req.files.photo[0];
    const bannerFile = req.files?.banner?.[0];

    const photoUrl = await uploadSingleImage(photoFile);
    let bannerUrl = null;

    if (bannerFile) {
      bannerUrl = await uploadSingleImage(bannerFile);
    }

    const plainPassword = passwordGenerator();


    


    const institutionUser = await User.create({
      email: parsedData.email,
      password: plainPassword,
      role: "institution",
    });


    const institution = await Institution.create({
      name: parsedData.name,
      email: parsedData.email,
      phone: parsedData.phone,
      website: parsedData.website,
      registrationNo: parsedData.registrationNo || null,
      establishDate: parsedData.establishDate ? new Date(parsedData.establishDate) : null,
      address: parsedData.address,
      geoLocation: {
        lat: lat,
        lng: lng
      },
      institutionBanner: bannerUrl | null,
      institutionImage: photoUrl,
      adminUser: institutionUser._id,
    });


    institutionUser.institution = institution._id;
    await institutionUser.save();


    await sendPasswordEmail(institutionUser.email, plainPassword)

    return res.status(201).json({
      message: "Institution created successfully",
      institution,
      credentials: {
        email: institutionUser.email,
        password: plainPassword,
      },
    });

  } catch (error) {
    console.log(error)
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "Email  already in use",
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error("Create student error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });

  }
};

const updateStatus = async (req, res) => {
  try {
    const adminId = req.user?._id;
    if (!adminId) {
      return res.status(403).json({ message: "Only admins can add institutions" });
    }



    const isAdmin = await User.findById(adminId);
    if (!isAdmin || isAdmin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add institutions" });
    }

    const institutionId = req.params.id;
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const { status } = req.body

    if (!status) {
      return res.status(404).json({
        message: "Status is not found"
      })
    }

    await Institution.findByIdAndUpdate(institutionId, {
      status: status
    })

    return res.status(200).json({
      message: "Status updated "
    })

  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error("Create student error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });

  }
}


const updateInstitution = async (req, res) => {
  try {
    const institutionId = req.params.id;
    const parsedData = institutionSchema.parse(req.body);
    const institution = await Institution.findByIdAndUpdate(institutionId, {
      name: parsedData.name,
      email: parsedData.email,
      phone: parsedData.phone,
      website: parsedData.website,
      registrationNo: parsedData.registrationNo,
      establishDate: parsedData.establishDate ? new Date(parsedData.establishDate) : null,
      address: parsedData.address,
    }, { new: true });

    if (!institution) {
      return res.status(400).json({ message: "Failed to update institution" });
    }
    return res.status(200).json({ message: "Institution updated successfully", institution });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }

}

const deleteInstitution = async (req, res) => {
  try {

    const adminId = req.user._id;
    if (!adminId) {
      return res.status(403).json({ message: "Only admins can delete institutions" });
    }
    const isAdmin = await User.findById(adminId);
    if (!isAdmin || isAdmin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete institutions" });
    }
    const institutionId = req.params.id;
    const institution = await Institution.findByIdAndDelete(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }
    const institutionUser = await User.findOneAndDelete({ institution: institutionId, role: "institution" });
    if (!institutionUser) {
      return res.status(404).json({ message: "Institution user not found" });
    }
    return res.status(200).json({ message: "Institution deleted successfully", institution });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting institution", error });
  }
}


const recentInstitution = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const institutions = await Institution.find()
      .sort({ createdAt: -1 })
      .limit(limit || 5);

    return res.status(200).json({
      message: "Recent institutions fetched successfully",
      data: institutions,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



const getAllInstitutions = async (req, res) => {
  try {
    const adminId = req.user?._id;

    if (!adminId) {
      return res.status(403).json({
        message: "Only admins can view institutions",
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [institutions, total] = await Promise.all([
      Institution.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "adminUser",
          select: "email password role",
        }),
      Institution.countDocuments(),
    ]);


    const formattedInstitutions = institutions.map((inst) => ({
      _id: inst._id,
      name: inst.name,
      email: inst.email,
      phone: inst.phone,
      website: inst.website,
      registrationNo: inst.registrationNo,
      establishDate: inst.establishDate,
      address: inst.address,
      password: inst.adminUser?.password || null,
      userEmail: inst.adminUser?.email || null,
      role: inst.adminUser?.role || null,
      status: inst.status
    }));

    return res.status(200).json({
      message: "Institutions fetched successfully",
      data: formattedInstitutions,
      totalCount: total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error fetching institutions",
    });
  }
};

const findOneInstitution = async (req, res) => {
  try {
    const institutionId = req.params.id;
    if (!institutionId) {
      return res.status(403).json({ message: "Institution ID is required" });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    return res.status(200).json({ message: "Institution fetched successfully", institution });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching institutions", error });
  }
}



const adminDashboard = async (req, res) => {
  try {
    const adminId = req.user?._id;

    // 🔐 Auth check
    if (!adminId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const isAdmin = await User.findById(adminId);
    if (!isAdmin || isAdmin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can access dashboard" });
    }

    // 📊 Counts
    const [
      totalInstitutions,
      totalStudents,
      totalCourses,
      recentInstitutions,
      recentStudents,
    ] = await Promise.all([
      Institution.countDocuments(),
      Student.countDocuments(),
      Course.countDocuments(),

      // 🕒 Recent Institutions
      Institution.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email registrationNo createdAt"),

      // 🕒 Recent Students
      Student.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email studentId institution createdAt")
        .populate("institution", "name"),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalInstitutions,
        totalStudents,
        totalCourses,
      },
      recent: {
        institutions: recentInstitutions,
        students: recentStudents,
      },
    });

  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



const sendPasswordToAdmin = async (req, res) => {
  try {
    const institutionId = req.params.id
    if (!institutionId) {
      return res.stats(404).json({
        message: "institution id is not found"
      })
    }

    const institution = await Institution.findById(institutionId)
    if(!institution){
        return res.stats(404).json({
        message: "institution  not found"
      })
    }

    const userId = await User.findById(institution.adminUser._id)
    
    if(!userId){
      return res.json(404).json({
        message: "user is not found"
      })
    }
    if(userId.role !== "institution"){
       return res.stats(404).json({
        message: "it is not a instution"
       })
    }

    await sendPasswordEmail("mousomray02@gmail.com",userId.password)
    return res.status(200).json({
      message: "Password send successfully"
    })

  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }

}




module.exports = { sendPasswordToAdmin, updateStatus, adminDashboard, adminLogOut, registerAdmin, loginAdmin, GetAdminProfile, addInstitution, getAllInstitutions, updateInstitution, deleteInstitution, findOneInstitution, recentInstitution };

