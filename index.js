import express from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session"
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"))
app.use(session({secret:"secret",saveUninitialized:false,resave:false}))
const isAuth = (req,res,next)=>{
    if(req.session.isAuth){
        next()
    }else{
        res.redirect("/login")
    }
}
function isProductInCart(cart,id){
    for(let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            return true;
        }
    }
    return false
}
function calculateTotal(cart,req){
    var total = 0
    for(let i=0;i<cart.length;i++){
            total+=parseInt(cart[i].price*cart[i].quantity)
    }
    req.session.total = total;
    return total;
}
mongoose.connect("mongodb://localhost:27017/loginDB",{useNewUrlParser:true});
const loginSchema = new mongoose.Schema({
    name: String,
    email: String,
    number: Number,
    password: String,
})
loginSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  };
  loginSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };
  
const Login = mongoose.model("Login", loginSchema);

app.post("/register", async(req, res)=> {
     
try{
    let new_login = new Login({
        name: req.body.name,
        email: req.body.Email,
        number:req.body.Phone
      });
    
      new_login.password = new_login.generateHash(req.body.Password);
      Login.findOne({email:req.body.Email}).then(user=>{
        if(user){
            res.render("register.ejs",{errmsg:"User already exists."})
        }else{
            new_login.save();
            res.redirect("/login")
        }
      })
}catch(error){
    console.error("Failed to make request", error.message);
}
})
app.post("/login",async(req,res)=>{
    Login.findOne({ email:req.body.Email })
        .then(user => {
            if (!user) res.render("login.ejs",{ errmsg: "User does not exists" })
            else{
            bcrypt.compare(req.body.Password, user.password, (err, data) => {

                if (err) throw err

                if (data) {
                    const imgurl="styles/user.png"
                    req.session.isAuth = true
                    res.render("home.ejs",{imgurl:imgurl,name:`Welcome ${user.name}`})
                    // res.redirect("/")
                } else {
                    res.render("login.ejs",{errmsg:"Invalid Credentials"})
                }

            })
        }
        })
})
app.post("/add_to_cart",async(req,res)=>{
    let id = req.body.id
    let name = req.body.name
    let price = req.body.price
    let image = req.body.image
    let quantity = req.body.quantity
    let product = {id:id,name:name,price:price,image:image,quantity:quantity}
    if(req.session.cart){
        var cart = req.session.cart;
        if(!isProductInCart(cart,id)){
            cart.push(product)
        }}else{
            req.session.cart=[product]
            var cart = req.session.cart
        }
        calculateTotal(cart,req);
        res.redirect("/cart")
})
app.post("/remove_product",async(req,res)=>{
    let id = req.body.id
    let cart = req.session.cart
    for(let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            cart.splice(i,1);
        }
    }
    calculateTotal(cart,req);
    res.redirect("/cart")
})
app.post("/edit_product_quantity",async(req,res)=>{
    let id = req.body.id
    let quantity = req.body.quantity
    let increase_btn = req.body.increase_product_quantity
    let decrease_btn = req.body.decrease_product_quantity

    let cart = req.session.cart
    if(increase_btn){
        for(let i=0;i<cart.length;i++){
            if(cart[i].id==id){
                if(cart[i].quantity>0){
                    cart[i].quantity = parseInt(cart[i].quantity)+1;
                }
            }
        }
    }
    if(decrease_btn){
        for(let i=0;i<cart.length;i++){
            if(cart[i].id==id){
                if(cart[i].quantity>1){
                    cart[i].quantity = parseInt(cart[i].quantity)-1;
                }
            }
        }
    }
    calculateTotal(cart,req)
    res.redirect("/cart")
})
app.get("/", (req, res)=>{
    try {   
        res.render("home.ejs")
    }catch(error){
        console.error("Failed to make request", error.message);
    }
})
app.get("/login", (req,res)=>{
    try {   
        res.render("login.ejs")
    }catch(error){
        console.error("Failed to make request", error.message);
    }    
})
app.get("/register", (req,res)=>{
    try {   
        res.render("register.ejs")
    }catch(error){
        console.error("Failed to make request", error.message);
    }    
})
app.get("/cart",(req,res)=>{
    try{
        let cart = req.session.cart;
        let total = req.session.total
        res.render("cart.ejs",{cart:cart,total:total,len:cart.length})
    }catch(error){
        console.error("Failed to make request",error.message)
    }
})
app.get("/about",(req,res)=>{
    try{
        res.render("aboutus.ejs")
    }catch(error){
        console.error("Failed to make request",error.message)
    }
})
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});       