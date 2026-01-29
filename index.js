const express = require("express")
const dotenv = require("dotenv")

const cors = require("cors")
const Conect = require("./src/db/Connent.js")
const cookieParser = require('cookie-parser')

dotenv.config()

const app = express()
 Conect()

app.use(cors(
    {
        origin : ["http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "PUTCH", "DELETE"],
        credentials: true
    }
))
app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

const adminRoutes = require ("./src/routes/admin.routes.js")
const institutionRoutes = require("./src/routes/institution.routes.js")

app.use("/api/admin", adminRoutes)
app.use("/api/institution",institutionRoutes)


const port = process.env.PORT

app.listen(port,() => {
    console.log(`server is runing ${port}`)
})