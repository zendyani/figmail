const fetch = require('node-fetch');
const express = require('express');
const fs = require('fs');
const Handlebars = require('handlebars');
const app = express();
const port = 3000;
let head = null;
let footer = null;

fs.readFile('components/head.html', 'utf8', function(err, file) {
  Handlebars.registerPartial('head', file);
  head = file
});

fs.readFile('components/footer.html', 'utf8', function(err, file) {
  Handlebars.registerPartial('foot', file);
  footer = file
});

function rgbToHex(r, g, b) {
  return 'rgba(' +  r * 255 + ',' + g * 255 + ',' +  b * 255 + ')'
}

function buildHeader(header) {
  const textEl = header.children.filter(child => child.name == 'text')[0];
  const backgroundEl = header.children.filter(child => child.name == 'background')[0];
  const bg = rgbToHex(backgroundEl.fills[0].color.r , backgroundEl.fills[0].color.g, backgroundEl.fills[0].color.b);
  const textColor = rgbToHex(textEl.fills[0].color.r, textEl.fills[0].color.g, textEl.fills[0].color.b);
  const text = textEl.characters;
  const promise = new Promise(function(resolve, reject) {
    fs.readFile('components/header.html', 'utf8', function(err, source) {
      var template = Handlebars.compile(source);
      var context = {bg, text, textColor};
      var html =  template(context);
      resolve(html);
    });
  });
  return promise
}

function buildBody(body) {
  const textEl = body.children.filter(child => child.name == 'text')[0];
  const backgroundEl = body.children.filter(child => child.name == 'background')[0];
  const bg = rgbToHex(backgroundEl.fills[0].color.r , backgroundEl.fills[0].color.g, backgroundEl.fills[0].color.b);
  const textColor = rgbToHex(textEl.fills[0].color.r, textEl.fills[0].color.g, textEl.fills[0].color.b);
  const text = textEl.characters;
  const promise = new Promise(function(resolve, reject) {
    fs.readFile('components/body.html', 'utf8', function(err, source) {
      var template = Handlebars.compile(source);
      var context = {bg, text, textColor};
      var html =  template(context);
      resolve(html);
    });
  });
  return promise
}

function convert(doc) {
  let content = doc.children[0].children.filter(child => child.type == 'FRAME')[0].children
  let promises = [];
  content.forEach(async (component) => {
    // build component in to file
    // match component with HTML file
    if (component.name === 'header') {
      promises.push(buildHeader(component))
    }
    if (component.name === 'body') {
      promises.push(buildBody(component))
    }
  });
  const template = Promise.all(promises).then(function(values) {
    const allComponents = head + values.join() + footer
    fs.writeFile('tmp/email.html', allComponents, function(err) {
      if(err) {return console.log(err);}
      console.log('The file was saved !');
    });
    return allComponents
  });
  return template
}

app.get('/convert', async (req, res) => {
  const url = 'https://api.figma.com/v1/files/' + req.query.key + '?id=' + req.query.id;
  try {
    const response = await fetch(url,{
      method: 'GET',
      headers: { "x-figma-token": '4378-ec89dc8d-6301-4ee7-ae8f-8fa7341a0f43'}
    });
    const json = await response.json();
    const converted = await convert(json.document)
    res.json(converted)
  } catch (error) {
    console.log(error);
  }

})

app.use('/', express.static(__dirname + '/'));

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
