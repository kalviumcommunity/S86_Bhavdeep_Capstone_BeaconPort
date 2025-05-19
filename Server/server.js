require("dotenv").config();
const express = require('express');
const app = express();

app.get('/', (req,res) => {
    res.send("Hello! Welcome to School Management System")
})


app.listen(process.env.PORT, ()=>{
    console.log(`server is running at http://localhost:${process.env.PORT}`);
})
