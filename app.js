// module.exports=Router;

const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistdb");

const itemsschema = {
  name: String,
};

const Item = mongoose.model("Item", itemsschema);

const item1 = new Item({
  name: "welcome to your todolist",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultitems = [item1, item2, item3];

const listschema = {
  name: String,
  items: [itemsschema],
};

const List = mongoose.model("List", listschema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length == 0) {
      Item.insertMany(defaultitems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved default items to DataBase");
        }
      });
      res.redirect("/");
    } else {
      res.render("list.ejs", { listtitle: "Today", newlistitems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customlistname = _.capitalize(req.params.customListName);

  List.findOne({ name: customlistname }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        const list = new List({
          name: customlistname,
          items: defaultitems,
        });

        list.save();
        res.redirect("/" + customlistname);
      } else {
        res.render("list.ejs", {
          listtitle: foundlist.name,
          newlistitems: foundlist.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemname = req.body.newitem;
  const listname = req.body.list;

  const item = new Item({
    name: itemname,
  });

  if (listname == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listname }, function (err, foundlist) {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listname);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkeditemid = req.body.checkbox;
  const listname = req.body.listName;

  if (listname == "Today") {
    Item.findByIdAndRemove(checkeditemid, function (err) {
      if (!err) {
        console.log("successfully deleted check item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listname },
      { $pull: { items: { _id: checkeditemid } } },
      function (err, foundlist) {
        if (!err) {
          res.redirect("/" + listname);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about.ejs");
});
app.listen(process.env.PORT || 3000, function () {
  console.log("server is running on port 3000");
});
