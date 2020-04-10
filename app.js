const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://emilioramirezeguia:test@cluster0-4nwda.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

//This is the Mongoose schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//This is the Mongoose model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Enjoy life"
});

const item2 = new Item({
  name: "Enjoy work"
});

const item3 = new Item({
  name: "Don't forget to smile"
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

const today = date.getDate();

app.get("/", function(req, res){

  Item.find( function(err, items) {
    if (err) {
      console.log(err);
    } else if (items.length == 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items.");
        };
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listDate: today,
        listTitle: "Personal",
        listItems: items
      });
    };
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName == "Personal") {
    item.save();
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$push: {items: item}}, function(err){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  };

});

app.get("/:listName", function(req, res){
  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, foundList){
    if (!err) {
      if(!foundList){
        //Create a new list
        const list = new List({
          name: listName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + listName);
      } else if (foundList.items.length == 0){
        console.log(foundList.items.length);
        foundList.items.push(defaultItems);
        List.findOneAndUpdate({name: listName}, {$push: {items: defaultItems}}, function(err){
          if (!err){
            console.log("Successfully added default items");
            res.redirect("/" + listName);
          }
        })
      } else {
        //Show an existing list
        res.render("list", {
          listDate: today,
          listTitle: foundList.name,
          listItems: foundList.items
        });
      };
    };
  });

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Personal") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  };

});

app.get("/about", function(req, res){
  res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});
