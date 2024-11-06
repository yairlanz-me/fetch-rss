const cl = (txt)=> console.log(txt);
import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { parse } from "https://deno.land/x/xml@6.0.0/mod.ts";

const app = new Hono()
const url = Deno.env.get("PANTRY_URL")

FetchRss(); 
Deno.cron("Cron rss",  "*/10 * * * *", FetchRss)

async function FetchRss(){
  const rssArr =[], rssItems={};
  const {feeds} = await Get(url+"/rss-feeds")
  for await (const u of feeds){
    try {
      const res = await fetch(u.url)
      let XMLdata = await res.text();
      XMLdata = XMLdata.slice(XMLdata.search("<channel>"),XMLdata.search("</rss>"));
      const jObj = parse(XMLdata).channel.item
      const items = jObj.map(({title, description, link, pubDate }) => ({title, description, link, pubDate }));
      items.map (i => {i.id=u.id, i.site=u.name, {...items}})
      rssArr.push(items.slice(0,Math.min(30,items.length)))
    } catch {continue}
  }
  rssItems.lastUpdt = new Date();
  rssItems.data = rssArr.flat().sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));
  Post(url+"/rss-items", rssItems)
  cl('Refreshed...' + rssItems.lastUpdt.toLocaleString());
} 
async function Get(url) {
  const res = await fetch(url); const data = await res.json(); return data;
}
async function Post(url,payload) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const res = await fetch(url, {method: "POST", body: JSON.stringify(payload), headers: myHeaders});
  return res;
}

app.get("/", (c) => {return c.text("Hello")})
export default { fetch: app.fetch };
