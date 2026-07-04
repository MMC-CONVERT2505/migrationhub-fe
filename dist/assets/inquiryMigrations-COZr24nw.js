import{d as a}from"./index-DB-3V5IS.js";const n={create:i=>a.post("/inquiry-migrations",i).then(t=>t.data),list:i=>a.get("/inquiry-migrations",{params:i}).then(t=>t.data)};export{n as i};
