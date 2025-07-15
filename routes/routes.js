const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');


// Image upload setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

const upload = multer({ storage: storage }).single("image");

// Insert a user into the database
router.post('/add', upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
        });

        await user.save();

        req.session.message = {
            type: "success",
            message: "User added successfully!"
        };

        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});

router.get('/about', (req, res) => {
    res.render('about', { title: "About" });
});

router.get('/contact', (req, res) => {
    res.render('contact', { title: "Contact" });
});
 
// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        res.render("index", {
            title: "Home Page",
            users: users,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

// Show Add User form
router.get('/add', (req, res) => {
    res.render('add_users', { title: "Add Users" });
});

// Edit user route

router.get('/edit/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.redirect('/');
        }
        res.render("edit_users", {
            title: "Edit User",
            user: user,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});


// update user route
router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        req.session.message = {
            type: "success",
            message: "User updated successfully!",
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});


// delete user route
router.get('/delete/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user.image !== '') {
            try {
                fs.unlinkSync('./uploads/' + user.image);
            } catch (err) {
                console.log('Error deleting image file:', err);
            }
        }

        await User.findByIdAndDelete(req.params.id);

        req.session.message = {
            type: 'success',
            message: 'User deleted successfully!',
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message });
    }
});


module.exports = router;
