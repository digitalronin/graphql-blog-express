const express = require("express");
const formidable = require("express-formidable");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 5000;
const API_TOKEN = process.env.API_TOKEN;
const ENDPOINT = process.env.ENDPOINT;

express()
  .use(expressLayouts)
  .use(formidable())
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => listPosts(req, res))
  .get("/post/new", (req, res) => res.render("pages/newpost"))
  .post("/post", (req, res) => addPost(req, res))
  .get("/post/:id", (req, res) => showPost(req.params.id, req, res))
  .post("/post/:id/comment", (req, res) => addComment(req.params.id, req, res))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

async function listPosts(req, res) {
  const obj = await graphqlQuery(`
    query {
      queryPost {
        id
        title
      }
    }
  `);
  res.render("pages/posts", { posts: obj.data.queryPost });
}

async function showPost(id, req, res) {
  const obj = await graphqlQuery(`
    query {
      queryPost(filter: {
        id: ["${id}"]
      }) {
        id
        title
        image
        body
        user {
          name
        }
        comments {
          body
          user {
            name
          }
        }
      }
    }
  `);
  res.render("pages/post", { post: obj.data.queryPost[0] });
}

async function addPost(req, res) {
  const obj = await graphqlQuery(`
    mutation {
      addPost(input: [
        {
          user: {
            name: "${req.fields.name}",
            email: "${req.fields.email}"
          },
          title: "${req.fields.title}",
          image: "${req.fields.image}",
          body: "${req.fields.body}",
        }
      ])
      {
        post {
          id
        }
      }
    }
  `);
  res.redirect(302, `/`);
}

async function addComment(id, req, res) {
  const obj = await graphqlQuery(`
    mutation {
      addComment(input: [
        {
          post: { id: "${id}" }
          body: "${req.fields.body}",
          user: {
            name: "${req.fields.name}",
            email: "${req.fields.email}"
          }
        }
      ]) {
        numUids
      }
    }
  `);

  res.redirect(302, `/post/${id}`);
}

async function graphqlQuery(graphql) {
  const result = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/graphql",
      Authorization: `bearer ${API_TOKEN}`
    },
    body: graphql
  });
  const obj = await result.json();
  console.log("obj:", obj);
  return obj;
}
