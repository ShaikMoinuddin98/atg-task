
const express=require("express")
const app=express()//our express server app
const jwt=require("jsonwebtoken")//for creating temporary tokens
const nodemailer=require("nodemailer")//for sending mails 
const session=require("express-session")//for maintaining session in apis
const mongoose=require("mongoose")//our database
const path=require("path")//for configuring the path of files and assets
const passportLocalMongoose=require("passport-local-mongoose")//passportjs in local stratagy for mongoose
const passport=require("passport")
const LocalStrategy=require("passport-local")

//our jwt secret
const JWT_SECRET="Moin-7396JWT"

//setting up the paths for  using ejs
app.set("views",path.join(__dirname,"views"))
app.set("view engine","ejs")
app.use(express.urlencoded({extended:true}))


//configuring the transporter for sending mails
const transporter = nodemailer.createTransport({
    service:"gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
     
      user:"imaginary.hub1@gmail.com",
      pass:"hbur gyqg nvgx ltlg",
    },
  });

//configuring our mail like the details of mail 
const mailoptions={
    from:{
        name:"Testing",
        address:"imaginary.hub1@gmail.com"
    },
    to:"",
    subject:"",
    text:""
    
}

//function for sending mails
const send=async (transporter,mailoptions)=>{
    try{
        await transporter.sendMail(mailoptions)
        console.log("email sent")

    }
    catch(err)
    {
        console.log(err)
    }
}



//connecting to database
main()
.then((res)=>{
    console.log("connection success")
})
.catch((err)=>{
    console.log(err)
})
async function main()
{
    await mongoose.connect("mongodb+srv://King-Moin:Moin-7093@cluster0.3uvscb7.mongodb.net/");
}

//our schema of db
const loginschema=new mongoose.Schema({
    username:{
        type:String
    },
    email:{
        type:String
    }
})

//making our loginschema to make username as the main field for userName
loginschema.plugin(passportLocalMongoose,{usernameField:'username'})//=-

//creating our database instance
const data=mongoose.model("atg",loginschema)

//configuring session options
const sessionoption={secret:"Moin-7396Session",resave:false,saveUninitialized:true}

//using passport locatstrategy for authenticating
passport.use(new LocalStrategy({usernameField:'username'},data.authenticate()));


//serializing user
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

//deserializing user
passport.deserializeUser(function(id, done) {
    data.findById(id).exec()
      .then(user => {
        return done(null, user);
      })
      .catch(err => {
        return done(err, null);
      });
  });

  //using our session
  app.use(session(sessionoption))//-------------------

  //initializing passport and session for it
  app.use(passport.initialize())//--------------
  app.use(passport.session())


//function for checking whether user is authenticated or not
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        // console.log(req.user)
        return next(); // If user is authenticated, continue with the next middleware
    }
    res.redirect("/login"); // If not authenticated, redirect to login page
}

app.get("/dashboard",isLoggedIn,(req,res)=>{
    res.render("home.ejs")
})

  app.get("/signup",(req,res)=>{
    res.render("signup.ejs")
})

app.post("/signup",async (req,res)=>{
    try{
    let {email,username,password}=req.body
    let inf={

        username:username,
                email:email
            }
    let u1=new data(inf)
    if(password.length<6)
    {
       
        res.redirect("/signup") 
    }
    else{
        let reguser=await data.register(u1,password)
    
    req.login(u1,(err)=>{
        if(err){
            console.log(err)
        }

        else
        {
           
            
            passport.authenticate("local",{failureRedirect:"/login"})(req,res,function(){
               
                res.redirect("/dashboard")
            })
            
            
        }
    })
    }
        }

    catch(err)
    {
  
        res.redirect("/signup") 
    }

})


app.get("/login",(req,res)=>{

    res.render("signin.ejs")
    
})

app.post("/login",(req,res)=>{
    let {username,password}=req.body
    const user=new data({
       username:username,
       password:password
    })
    try
    {
    req.login(user,(err)=>{
        if(err){
            console.log(err)
        }

        else
        {
           
            
            passport.authenticate("local",{failureRedirect:"/login"})(req,res,function(){
               
                res.redirect("/dashboard")
            })
            
            
        }
    })
    }
    catch(err)
    {
        res.redirect("/login")
       
    }

})

app.get("/logout", async (req,res,next)=>{
    //logout method
    await req.logout((err)=>{
        if(err){
            return next(err)
        }
        else
        {
        res.redirect("/login")
        }
    })

})








app.get("/forgetpass",(req,res)=>{

    res.render("forgetpass.ejs")
})


app.post("/forgetpass", async (req, res) => {
    try {
      let { mail } = req.body;
      let user = await data.findOne({ email: mail });
  
      if (user) {
        res.render("forgetpasssucces.ejs")
        const secret=JWT_SECRET+"Moin-7093"
        const payload={
            email:user.email,
            id:user.id
        }
        console.log(payload)
        const token=jwt.sign(payload,secret,{expiresIn:"2m"})
        const link=`http://localhost:9000/reset-pass/${user.id}/${token}`
        console.log(link)
        mailoptions.to=mail
        mailoptions.subject="Password Reset Request"
        mailoptions.text=`use this link for updating password,link expires in 2 min,${link}`
        send(transporter,mailoptions)
      } else {
        throw new Error("User not found"); // You should throw a specific error here
      }
    } catch (error) {
        
      res.redirect("/forgetpass")
    
    }
  });

  app.get("/reset-pass/:id/:token",(req,res)=>{

    let {id,token}=req.params
    const secret=JWT_SECRET+"Moin-7093"
    try{
        const payload=jwt.verify(token,secret)
        res.render("updatepass.ejs")
    }
    catch(err)
    {
        
        console.log(err)
        res.render("updatepasserror.ejs")
    }
  })

  app.post("/reset-pass/:id/:token",async (req,res)=>{
    let {token,id}=req.params

    let {pass}=req.body
   
    const secret=JWT_SECRET+"Moin-7093"
    try{
        if(pass.length<6)
        {
           
            res.render("updatepass.ejs")
        }
        else{
        const payload=jwt.verify(token,secret)
        let u=await data.findOne({email:payload.email})
       
      
        let cp={username:u.username,email:u.email}
      
        await data.deleteOne({email:u.email})
        .then(async (re)=>{

        
        console.log(u)
        let d=new data(cp)
        let ruser=await data.register(d,pass)
        res.render("updatepasssuccess.ejs")
        })
        .catch((err)=>{
          console.log(err)
            res.send("error")
        })
        
        }
    }
    catch(err){
      
        console.log(err)
        res.send("error")
    }
})















app.listen("9000",()=>{
    console.log("listening")
})
