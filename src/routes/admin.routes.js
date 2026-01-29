const router = require("express").Router();

const {sendPasswordToAdmin,updateStatus,adminDashboard,adminLogOut,recentInstitution, registerAdmin, loginAdmin, GetAdminProfile ,findOneInstitution, addInstitution, updateInstitution, deleteInstitution, getAllInstitutions} = require("../controller/admin.controller.js");
const verifyJwt = require("../middleware/verifiyUser.js");
const {uploadStudentImages} = require("../middleware/multiMulter.js")

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/admin-profile",verifyJwt, GetAdminProfile);
router.post("/update-status/:id",verifyJwt,updateStatus )
router.post("/create-institution",uploadStudentImages,verifyJwt, addInstitution);
router.put("/update-institution/:id",verifyJwt, updateInstitution);
router.delete("/delete-institution/:id",verifyJwt, deleteInstitution);
router.get("/all-institutions",verifyJwt, getAllInstitutions);
router.get("/institution/:id", findOneInstitution);
router.get("/recent-institutions", recentInstitution);
router.post("/logout", verifyJwt, adminLogOut);
router.get("/dashboard",verifyJwt,adminDashboard)
router.post("/send-password/:id",sendPasswordToAdmin )

module.exports = router;