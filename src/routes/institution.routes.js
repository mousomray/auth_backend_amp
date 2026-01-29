const router = require("express").Router();

const {buyCourse,institutionLogOut,institutionDashboard,courseDetails,deleteCoures,updateCourse,studentDetails,loginInstitution,createCourse,getMyCourses,createStudent,getMyStudents,StudentDropDown,updateStudent,deleteStudent,OnlyOneStudentAPI} = require("../controller/institution.controller.js");
const verifyJwt = require("../middleware/verifiyUser.js");
const {upload} = require("../middleware/multer.js")
const {uploadStudentImages} = require("../middleware/multiMulter.js")

router.post("/login", loginInstitution);
router.post("/create-course",verifyJwt,upload.single("image"),createCourse)
router.get("/get-course",verifyJwt,getMyCourses)
router.post("/create-student",verifyJwt, uploadStudentImages, createStudent);
router.get("/get-student", verifyJwt,getMyStudents)
router.get("/all-students", verifyJwt,StudentDropDown)
router.put("/update-student/:id",updateStudent)
router.delete("/delete-student/:id",verifyJwt,deleteStudent)
router.get("/student-detail/:id",studentDetails)
router.put("/update-course/:id",updateCourse)
router.delete("/delete-course/:id",deleteCoures)
router.get("/course-detail/:id",courseDetails)
router.get("/dashboard",verifyJwt,institutionDashboard)
router.post("/logout",verifyJwt,institutionLogOut)
router.post("/buy",buyCourse)
router.get("/onlyonestudentapi/:id",OnlyOneStudentAPI)
module.exports = router;