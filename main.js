//const cl = (txt)=> console.log(txt);
import { parse } from "https://deno.land/x/xml@6.0.0/mod.ts";
const url = Deno.env.get("PANTRY_KEY")

async function Get(url) {
  const res = await fetch(url); const data = await res.json(); return data;
}
async function Post(url,payload) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const res = await fetch(url, {method: "POST", body: JSON.stringify(payload), headers: myHeaders});
  return res;
}

FetchRss(); 
Deno.cron("Cron rss",  "*/10 * * * *", FetchRss)

async function FetchRss(){
  let rssObj = await Get(url)
  const rssArr =[]
  for await (let u of rssObj.feeds){
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
  const rssData = rssArr.flat();
  rssData.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));
  rssObj.data = rssData; rssObj.lastUpdt = new Date();
  Post(url, rssObj)
  cl('Refreshed...' + rssObj.lastUpdt.toLocaleString());
} 
