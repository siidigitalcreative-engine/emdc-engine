import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_KEY = "emdc:app-state:v1";
const SKU_CHUNK_PREFIX = "emdc:app-state:v1:sku-items:chunk:";
const SKU_META_KEY = "emdc:app-state:v1:sku-items:meta";
const LOCAL_STORAGE_CHUNK_PREFIX = "emdc:app-state:v1:local-storage:chunk:";
const LOCAL_STORAGE_META_KEY = "emdc:app-state:v1:local-storage:meta";
const LAST_GOOD_KEY = "emdc:app-state:v1:last-good";
const HISTORY_INDEX_KEY = "emdc:app-state:v1:history";
const HISTORY_PREFIX = "emdc:app-state:v1:backup:";

const MAX_LOCAL_STORAGE_VALUE_LENGTH = 80_000;
const MAX_SKU_CHUNKS = 2000;
const MAX_LOCAL_STORAGE_CHUNKS = 4000;

function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

  if (!url || !token) {
    throw new Error("Missing Redis REST environment variables.");
  }

  if (!url.startsWith("http")) {
    throw new Error("Redis URL must be the REST URL that starts with https://, not the rediss:// URL.");
  }

  return new Redis({ url, token });
}

const emptyState = {
  version: 1,
  updatedAt: "",
  appState: {},
  localStorage: {},
};

const RECOVERY_APP_STATE:any = {"skuBrands":[{"id":"slique","name":"Slique","color":"#111827"},{"id":"scrubz","name":"Scrubz","color":"#111827"},{"id":"crysalis","name":"Crysalis","color":"#111827"},{"id":"primeo","name":"Primeo","color":"#111827"},{"id":"nest","name":"Nest Design Lab","color":"#111827"},{"id":"moderno","name":"Moderno","color":"#111827"},{"id":"fitspire","name":"Fitspire","color":"#111827"},{"id":"graylabel","name":"Gray Label","color":"#111827"},{"id":"quencha","name":"Quencha","color":"#111827"}],"skuItems":[],"skuTableColumns":[{"key":"brand","label":"Brand","base":true},{"key":"sku","label":"SKU","base":true},{"key":"collection","label":"Category","base":true},{"key":"tag","label":"Tag","base":true},{"key":"productName","label":"Product","base":true},{"key":"srp","label":"SRP","base":true},{"key":"imageLink","label":"Image Link","base":true}],"checklistGroups":[{"id":"bkinw7c","groupName":"Recovered Checklist 1","launchType":"introduction","skus":[],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#8B5CF6","recovered":true},{"id":"kyt55z9","groupName":"Recovered Checklist 2","launchType":"introduction","skus":[],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#8B5CF6","recovered":true},{"id":"sjxjwpn","groupName":"Recovered Checklist 3","launchType":"introduction","skus":[],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#8B5CF6","recovered":true},{"id":"7b2uisf","groupName":"Primeo Stainless Steel Pedal Bin","launchType":"introduction","skus":[{"id":"pbn2pkg","value":"PRM-PB5L-SL","sku":"PRM-PB5L-SL","productName":"Primeo 5L Pedal Waste Bin","collection":"WASTE BIN","category":"WASTE BIN","brandId":"primeo","inventory":0,"status":"active","extraFields":{},"srp":"1299.75","imageLink":"https://ph-live.slatic.net/p/8670e56c39cd5ee5ca98012ef86090cc.png","customStatus":"","tag":"","sourceId":"pbn2pkg","productCategory":"WASTE BIN","syncedFromSkuStorage":true},{"id":"p86su4l","value":"PRM-PB50L-SL","sku":"PRM-PB50L-SL","productName":"Primeo 50L Pedal Waste Bin","collection":"WASTE BIN","category":"WASTE BIN","brandId":"primeo","inventory":0,"status":"active","extraFields":{},"srp":"5949.75","imageLink":"https://ph-live.slatic.net/p/5f88d71c2976a8fbfa1ecc3546981193.png","customStatus":"","tag":"","sourceId":"p86su4l","productCategory":"WASTE BIN","syncedFromSkuStorage":true}],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#3B82F6","recovered":false,"linkedEventIds":[]},{"id":"66wz0d5","groupName":"CRYSALIS Amber Luxe Glass Baking Dish","launchType":"introduction","skus":[{"id":"hkjprzr","value":"CRY-ALOGBD20","sku":"CRY-ALOGBD20","productName":"Oval Bake Dish 2000ml","collection":"BAKING","category":"BAKING","brandId":"crysalis","inventory":0,"status":"active","extraFields":{}},{"id":"647lrwd","value":"CRY-ALOGBD26","sku":"CRY-ALOGBD26","productName":"Oval Bake Dish 2600ml","collection":"BAKING","category":"BAKING","brandId":"crysalis","inventory":0,"status":"active","extraFields":{}},{"id":"gee85l2","value":"CRY-ALRGBD20","sku":"CRY-ALRGBD20","productName":"Round Bake Dish 2000ml","collection":"BAKING","category":"BAKING","brandId":"crysalis","inventory":0,"status":"active","extraFields":{}},{"id":"i3tdrs3","value":"CRY-ALRGBD15","sku":"CRY-ALRGBD15","productName":"Rectangle Bake Dish 1500ml","collection":"BAKING","category":"BAKING","brandId":"crysalis","inventory":0,"status":"active","extraFields":{}},{"id":"tqci0gt","value":"CRY-ALRGBD24","sku":"CRY-ALRGBD24","productName":"Rectangle Bake Dish 2000ml","collection":"BAKING","category":"BAKING","brandId":"crysalis","inventory":0,"status":"active","extraFields":{}},{"id":"uvewnay","value":"CRY-ALSGBD25","sku":"CRY-ALSGBD25","productName":"Square Bake Dish 2500ml","collection":"BAKING","category":"BAKING","brandId":"crysalis","inventory":0,"status":"active","extraFields":{}}],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#3B82F6","recovered":false,"linkedEventIds":[]},{"id":"8fegehr","groupName":"Crysalis Inox Stainless Cookware","launchType":"introduction","skus":[{"product":"CRYSALIS Stainless Steel Inox Fry pan 20cm","productName":"CRYSALIS Stainless Steel Inox Fry pan 20cm","sku":"CRY-STSFP-20","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"ed244ym","brandId":"crysalis","inventory":0,"srp":"1199.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"ed244ym","value":"CRY-STSFP-20","productCategory":"COOKWARE","syncedFromSkuStorage":true},{"product":"CRYSALIS Stainless Steel Inox Fry pan 24cm","productName":"CRYSALIS Stainless Steel Inox Fry pan 24cm","sku":"CRY-STSFP-24","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"48h6v0a","brandId":"crysalis","inventory":0,"srp":"1399.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"48h6v0a","value":"CRY-STSFP-24","productCategory":"COOKWARE","syncedFromSkuStorage":true},{"product":"CRYSALIS Stainless Steel Inox Fry pan 28cm","productName":"CRYSALIS Stainless Steel Inox Fry pan 28cm","sku":"CRY-STSFP-28","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"hmf4sjq","brandId":"crysalis","inventory":0,"srp":"1699.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"hmf4sjq","value":"CRY-STSFP-28","productCategory":"COOKWARE","syncedFromSkuStorage":true},{"product":"CRYSALIS Stainless Steel Inox Sauce pan 16cm","productName":"CRYSALIS Stainless Steel Inox Sauce pan 16cm","sku":"CRY-STSSP-16","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"54gqa7k","brandId":"crysalis","inventory":0,"srp":"1599.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"54gqa7k","value":"CRY-STSSP-16","productCategory":"COOKWARE","syncedFromSkuStorage":true},{"product":"CRYSALIS Stainless Steel Inox Sauce pan 18cm","productName":"CRYSALIS Stainless Steel Inox Sauce pan 18cm","sku":"CRY-STSSP-18","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"cjlj9o5","brandId":"crysalis","inventory":0,"srp":"1999.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"cjlj9o5","value":"CRY-STSSP-18","productCategory":"COOKWARE","syncedFromSkuStorage":true},{"product":"CRYSALIS Stainless Steel Inox Dutch Oven 20cm","productName":"CRYSALIS Stainless Steel Inox Dutch Oven 20cm","sku":"CRY-STSDO-20","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"r997u0k","brandId":"crysalis","inventory":0,"srp":"2299.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"r997u0k","value":"CRY-STSDO-20","productCategory":"COOKWARE","syncedFromSkuStorage":true},{"product":"CRYSALIS Stainless Steel Inox Dutch Oven 24cm","productName":"CRYSALIS Stainless Steel Inox Dutch Oven 24cm","sku":"CRY-STSDO-24","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"qh5dzae","brandId":"crysalis","inventory":0,"srp":"2699.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"qh5dzae","value":"CRY-STSDO-24","productCategory":"COOKWARE","syncedFromSkuStorage":true},{"product":"CRYSALIS Stainless Steel Inox Wok Pan 28cm","productName":"CRYSALIS Stainless Steel Inox Wok Pan 28cm","sku":"CRY-STSWP-28","brand":"Crysalis","collection":"COOKWARE","category":"COOKWARE","id":"57vqoxz","brandId":"crysalis","inventory":0,"srp":"2399.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"57vqoxz","value":"CRY-STSWP-28","productCategory":"COOKWARE","syncedFromSkuStorage":true}],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#8B5CF6","recovered":false},{"id":"ithhc0q","groupName":"Primeo Polyresin Bathroom Accessories","launchType":"introduction","skus":[{"id":"5f2qrwe","value":"PRM-POL-SD-TP","sku":"PRM-POL-SD-TP","productName":"Primeo Poly Resin Soap Dish","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"sstc7m4","value":"PRM-POL-TB-TP","sku":"PRM-POL-TB-TP","productName":"Primeo Poly Resin Tumbler","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"nz2pmqy","value":"PRM-POL-LD-TP","sku":"PRM-POL-LD-TP","productName":"Primeo Poly Resin Lotion Dispenser","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"12djkkn","value":"PRM-POL-TOH-TP","sku":"PRM-POL-TOH-TP","productName":"Primeo Poly Resin Toilet Brush Holder","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"mwcr6zf","value":"PRM-POL-SD-WT","sku":"PRM-POL-SD-WT","productName":"Primeo Poly Resin Soap Dish","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"h8pyat5","value":"PRM-POL-TB-WT","sku":"PRM-POL-TB-WT","productName":"Primeo Poly Resin Tumbler","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"2ahv55t","value":"PRM-POL-LD-WT","sku":"PRM-POL-LD-WT","productName":"Primeo Poly Resin Lotion Dispenser","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"njkz3gu","value":"PRM-POL-TOH-WT","sku":"PRM-POL-TOH-WT","productName":"Primeo Poly Resin Toilet Brush Holder","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"pac4vat","value":"PRM-POL-SD-GY","sku":"PRM-POL-SD-GY","productName":"Primeo Poly Resin Soap Dish","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"4sb4wu7","value":"PRM-POL-TB-GY","sku":"PRM-POL-TB-GY","productName":"Primeo Poly Resin Tumbler","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"vqskji1","value":"PRM-POL-LD-GY","sku":"PRM-POL-LD-GY","productName":"Primeo Poly Resin Lotion Dispenser","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"oa9k84d","value":"PRM-POL-TOH-GY","sku":"PRM-POL-TOH-GY","productName":"Primeo Poly Resin Toilet Brush Holder","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"wqnfspc","value":"PRM-POL-SD-BK","sku":"PRM-POL-SD-BK","productName":"Primeo Poly Resin Soap Dish","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"uvibg5v","value":"PRM-POL-TB-BK","sku":"PRM-POL-TB-BK","productName":"Primeo Poly Resin Tumbler","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"fmrzase","value":"PRM-POL-LD-BK","sku":"PRM-POL-LD-BK","productName":"Primeo Poly Resin Lotion Dispenser","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}},{"id":"30ogl3t","value":"PRM-POL-TOH-BK","sku":"PRM-POL-TOH-BK","productName":"Primeo Poly Resin Toilet Brush Holder","collection":"BATHROOM ACCESSORIES","category":"BATHROOM ACCESSORIES","brandId":"primeo","inventory":0,"status":"active","extraFields":{}}],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#3B82F6","recovered":true,"linkedEventIds":[]},{"id":"4qvgp5r","groupName":"Crysalis Acacia Salt and Pepper Mill","launchType":"introduction","skus":[{"product":"CRYSALIS SALT & PEPPER MILL","productName":"CRYSALIS SALT & PEPPER MILL","sku":"CRY-ACASPM","brand":"Crysalis","collection":"ACACIA WOOD","category":"ACACIA WOOD","id":"0stxp3g","brandId":"crysalis","inventory":0,"srp":"699.75","imageLink":"0","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"0stxp3g","value":"CRY-ACASPM","productCategory":"ACACIA WOOD","syncedFromSkuStorage":true},{"product":"CRYSALIS Acacia Wood Salt Pepper Mill 6inch","productName":"CRYSALIS Acacia Wood Salt Pepper Mill 6inch","sku":"CRY-ACASPM6","brand":"Crysalis","collection":"ACACIA WOOD","category":"ACACIA WOOD","id":"gv8nddz","brandId":"crysalis","inventory":0,"srp":"629.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"gv8nddz","value":"CRY-ACASPM6","productCategory":"ACACIA WOOD","syncedFromSkuStorage":true},{"product":"CRYSALIS Acacia Wood Salt Pepper Mill 8inch","productName":"CRYSALIS Acacia Wood Salt Pepper Mill 8inch","sku":"CRY-ACASPM8","brand":"Crysalis","collection":"ACACIA WOOD","category":"ACACIA WOOD","id":"6avzoyj","brandId":"crysalis","inventory":0,"srp":"699.75","imageLink":"","status":"active","customStatus":"","extraFields":{},"tag":"","sourceId":"6avzoyj","value":"CRY-ACASPM8","productCategory":"ACACIA WOOD","syncedFromSkuStorage":true}],"deadline":"","deadlineEnd":"","dateMode":"specific","monthOnlyMonths":[],"calendarType":"deadline","calendarColor":"#8B5CF6","recovered":false}],"checklistItems":{},"checklistStatuses":[{"id":"todo","label":"To Do","color":"#9CA3AF"},{"id":"inprogress","label":"In Progress","color":"#3B82F6"},{"id":"blocked","label":"Blocked","color":"#EF4444"},{"id":"done","label":"Done","color":"#22C55E"}],"calendarEvents":[{"id":"5jz4v4o","date":"2026-07-05","title":"11.11 Campaign Go-Live","type":"launch","color":"#22C55E"},{"id":"85xom4t","date":"2026-07-02","title":"Shopee Flash Deal Deadline","type":"deadline","color":"#EF4444"}],"calendarTypes":[{"id":"task","label":"Task","color":"#EC4899","useColor":true},{"id":"campaign","label":"Campaign","color":"#F59E0B","useColor":true},{"id":"deadline","label":"Deadline","color":"#F97316","useColor":true},{"id":"launch","label":"Launch","color":"#3B82F6","useColor":true},{"id":"meeting","label":"Meeting","color":"#6B7280","useColor":true},{"id":"seasonal","label":"Seasonal","color":"#22C55E","useColor":true},{"id":"holiday","label":"Holiday","color":"#EF4444","useColor":true}],"seasonalEvents":[{"id":"s1","name":"Valentine's Day","date":"Feb 14","calDate":"2026-02-14","type":"holiday","color":"#EF4444","desc":"Romance-driven gifting peak. Personal care, fragrances, and couple gifting dominate. Online orders spike 3-5x the week before.","products":["Perfumes & body mists (Shopee PH top category)","Facial skincare sets","Scented candles & diffusers","Couple mugs & tumblers","Chocolate & sweets gift packs"]},{"id":"s2","name":"Mother's Day","date":"2nd Sun of May","calDate":"yearly:05-10","type":"holiday","color":"#EF4444","desc":"One of the top gifting occasions nationally. Premium self-care and home products perform best. Bundles outperform single SKUs.","products":["Skincare & beauty gift sets","Perfume & lotion bundles","Kitchen appliances (air fryer, blender)","Personalized jewelry & accessories","Flowers & hamper combos (Lazada/Shopee top sellers)"],"months":[]},{"id":"s3","name":"Back to School","date":"June - July","calDate":"2026-06-01","calDateEnd":"2026-07-31","type":"seasonal","color":"#22C55E","desc":"One of the highest-volume seasons in PH. Practical, value-for-money items dominate. Parents and students both buying.","products":["Insulated water bottles & tumblers","Lunch boxes & food containers","School bags & backpacks","Stationery & organizers","Desk fans & study lamps"]},{"id":"s4","name":"Mid-Year Sale (6.6-7.7)","date":"June - July","calDate":"2026-06-06","calDateEnd":"2026-07-07","type":"campaign","color":"#F59E0B","desc":"Platform-wide mega sale. Electronics, fashion, and home consistently top the charts. Flash deals in the first hour convert best.","products":["Electronics & gadget accessories","Fashion & apparel","Home & living essentials","Beauty & personal care","Sports & fitness gear"]},{"id":"s5","name":"Independence Day PH","date":"June 12","calDate":"2026-06-12","type":"holiday","color":"#EF4444","desc":"Patriotic sentiment drives Filipino-made and locally inspired purchases. Food, lifestyle, and heritage products do well.","products":["Local food & delicacy gift packs","Filipino-made lifestyle products","Barong & traditional apparel","Home decor with Filipino design","Outdoor & picnic essentials"]},{"id":"s6","name":"Ber Months / Christmas Prep","date":"Sep - Nov","calDate":"yearly:09-01","calDateEnd":"yearly:11-30","type":"seasonal","color":"#22C55E","desc":"PH's Christmas season starts in September \u2014 the longest in the world. Gift-buying mindset kicks in early. Hampers and bundles move fast.","products":["Gift hampers & bundles","Christmas decor & lights","Food items & noche buena essentials","Toy & kids gift sets","Premium candles & home fragrance"],"months":[]},{"id":"s7","name":"10.10 Sale","date":"Oct","calDate":"yearly:10-01","calDateEnd":"yearly:10-11","type":"campaign","color":"#F59E0B","desc":"A holiday-prep sale for early gift buyers, home refresh, party prep, and Christmas bundle teasers.","products":["Smartphones & earbuds (highest AOV)","Air purifiers & fans","Skincare & beauty megabundles","Cookware & kitchen tools","Fitness equipment & activewear"],"months":[]},{"id":"s8","name":"12.12 Christmas Sale","date":"Dec 12","calDate":"yearly:12-01","type":"campaign","color":"#F59E0B","desc":"Final major platform sale before Christmas. Last-chance gifting and year-end personal purchases drive volume.","products":["Last-minute Christmas gift sets","Travel bags & luggage","Premium skincare & wellness kits","Smart home devices","Clothing & fashion accessories"],"months":[],"calDateEnd":"yearly:12-14"},{"id":"s9","name":"Christmas","date":"Dec 25","calDate":"2026-12-25","type":"holiday","color":"#EF4444","desc":"Highest emotional gifting moment of the year. Premium presentation and gift-ready packaging matter most.","products":["Noche Buena food packs (ham, queso, etc.)","Premium gift sets & hampers","Toys & kids gifts","Home appliances as family gifts","Wines, spirits & celebration items"]},{"id":"s10","name":"New Year","date":"Jan 1","calDate":"yearly:01-01","type":"holiday","color":"#EF4444","desc":"New year resolution spending \u2014 health, fitness, and home reset. Motivational and self-improvement categories spike in January.","products":["Fitness equipment & resistance bands","Insulated water bottles & shakers","Planners, journals & stationery","Home organization & storage","Vitamins & health supplements"],"months":[]},{"id":"s11","name":"Women's Month","date":"March","calDate":"2026-03-01","type":"seasonal","color":"#22C55E","desc":"Empowerment and self-care messaging resonates strongly. Women are both the buyers and the recipients. Beauty and wellness lead.","products":["Premium skincare & serums","Self-care kits & spa sets","Activewear & leggings","Empowerment-themed accessories & bags","Books, journals & wellness products"]},{"id":"s12","name":"Payday Sales (15th & 30th)","date":"Monthly","calDate":null,"type":"campaign","color":"#F59E0B","desc":"Recurring monthly spend spike every 15th and 30th. Everyday essentials and mid-range lifestyle products perform best on these days.","products":["Everyday personal care (body wash, shampoo)","Reusable tumblers & food containers","Affordable fashion & footwear","Home cleaning & organization tools","Snacks & ready-to-eat food packs"]},{"id":"tja4f1q","name":"Nutrition Month","date":"Jul","type":"seasonal","color":"#22C55E","desc":"","calDate":"yearly:07-01","calDateEnd":"yearly:07-31","months":[],"products":[],"_monthOnlyIndex":6,"_monthOnlyCloneId":"tja4f1q-6"},{"id":"jbdtfs3","name":"Teacher's Month ","date":"Sep / Oct","type":"seasonal","color":"#22C55E","desc":"An appreciation season for teachers, perfect for affordable and thoughtful gift items.","calDate":"yearly:09-05","calDateEnd":"yearly:10-05","months":[],"products":[]},{"id":"xr80ttq","name":"Halloween","date":"Oct 31","type":"holiday","color":"#EF4444","desc":"A fun and playful season for spooky-themed content, kids\u2019 activities, parties, and novelty promos.","calDate":"yearly:10-31","calDateEnd":null,"months":[],"products":[]},{"id":"rd2b0vb","name":"All Saints' & All Souls' Day","date":"Nov 1 - 2","type":"holiday","color":"#EF4444","desc":"A family remembrance season often connected to travel, cemetery visits, and respectful family gatherings.","calDate":"yearly:11-01","calDateEnd":"2026-11-02","months":[],"products":[]},{"id":"kpc5mqx","name":"11.11 Mega Sale","date":"Nov 11","type":"campaign","color":"#F59E0B","desc":"A major online shopping season for early Christmas gifts, big bundles, and mega sale promotions.","calDate":"yearly:11-01","calDateEnd":"yearly:11-14","months":[],"products":[]},{"id":"jjfg2ka","name":"Black Friday","date":"Nov","type":"seasonal","color":"#22C55E","desc":"An online deal event focused on flash sales, limited-time discounts, and tech-style promo messaging.","calDate":"yearly:11-23","calDateEnd":"yearly:11-27","months":[],"products":[]},{"id":"yrqxbdf","name":"Year-End","date":"Last week of Dec ","type":"seasonal","color":"#22C55E","desc":"Cleaning, organizing, restocking, and preparing for the new year.","calDate":"yearly:12-26","calDateEnd":"yearly:12-31","months":[],"products":[]},{"id":"iciyi4t","name":"Father's Day ","date":"3rd Sun of June","type":"holiday","color":"#EF4444","desc":"A practical gifting season for dads, focused on useful, durable, and everyday items.","calDate":"yearly:06-21","calDateEnd":"2026-06-21","months":[],"products":[]},{"id":"5kc3pjf","name":"Rainy Season","date":"Jun - Nov","type":"seasonal","color":"#22C55E","desc":"A cozy and practical season focused on warm meals, home organization, cleaning, and school/work essentials.","calDate":"yearly:06-01","calDateEnd":"yearly:11-30","months":[],"products":[]},{"id":"vew5dae","name":"1.1 New Year Sale ","date":"Jan","type":"campaign","color":"#F59E0B","desc":"A fresh-start sale for new routines, home reset, organization, fitness, and practical daily essentials.","calDate":"yearly:01-01","calDateEnd":"yearly:01-03","months":[],"products":[]},{"id":"liptkoh","name":"2.2 Sale ","date":"Feb","type":"campaign","color":"#F59E0B","desc":"Sale after New Year, good for Valentine\u2019s prep and early-year deals.","calDate":"yearly:02-01","calDateEnd":"yearly:02-03","months":[],"products":[]},{"id":"1wdbvnt","name":"3.3 Sale","date":"Mar","type":"campaign","color":"#F59E0B","desc":"A summer prep sale focused on travel, hydration, outdoor items, and school/graduation gifts.","calDate":"yearly:03-01","calDateEnd":"yearly:03-04","months":[],"products":[]},{"id":"jchigbx","name":"4.4 Sale","date":"Apr","type":"campaign","color":"#F59E0B","desc":"A strong summer sale for beach trips, cooling essentials, tumblers, picnic items, and travel products.","calDate":"yearly:04-01","calDateEnd":"yearly:04-05","months":[],"products":[]},{"id":"ptktjdq","name":"5.5 Sale","date":"May","type":"campaign","color":"#F59E0B","desc":"A mid-year warm-up sale, good for Mother\u2019s Day gifts, summer items, and early back-to-school shopping.","calDate":"yearly:05-01","calDateEnd":"yearly:05-06","months":[],"products":[]},{"id":"hnetfqh","name":"6.6 Mid-year Sale","date":"Jun","type":"campaign","color":"#F59E0B","desc":"A major mid-year sale, best for back-to-school essentials, Father\u2019s Day gifts, and rainy season products.","calDate":"yearly:06-01","calDateEnd":"yearly:06-07","months":[],"products":[]},{"id":"bv8q4e6","name":"8.8 Sale","date":"Aug","type":"campaign","color":"#F59E0B","desc":"A rainy season and payday sale focused on practical everyday essentials, home upgrades, baon items, organization, cleaning, wellness, and early \u201cBer Months\u201d prep.","calDate":"yearly:08-01","calDateEnd":"yearly:08-09","months":[],"products":[]},{"id":"ioj02er","name":"9.9 Sale","date":"Sep","type":"campaign","color":"#F59E0B","desc":"One of the biggest pre-holiday sales, strong for bundles, early Christmas shopping, and major product pushes.","calDate":"yearly:09-01","calDateEnd":"yearly:09-10","months":[],"products":[]},{"id":"6e4wyxf","name":"Chinese New Year","date":"Feb","type":"seasonal","color":"#22C55E","desc":"A celebration of luck, prosperity, family gatherings, and red/gold gifting theme","calDate":"yearly:02-06","calDateEnd":"yearly:02-06","months":[],"products":[]},{"id":"8yuujqz","name":"Graduation/Recognition","date":"4th week of Mar - Apr","type":"seasonal","color":"#22C55E","desc":"(For Elementary to Highschool) A milestone season celebrating student achievements, rewards, and appreciation gifts.","calDate":"yearly:03-26","calDateEnd":"yearly:04-30","months":[],"products":[]},{"id":"cwlgr7j","name":"Graduation/Recognition (College)","date":"May - July","type":"seasonal","color":"#22C55E","desc":"Student achievements, rewards, and appreciation gifts.","calDate":"yearly:05-01","calDateEnd":"yearly:07-31","months":[],"products":[]},{"id":"kgeq4ae","name":"Summer Season","date":"Mar - May","type":"seasonal","color":"#22C55E","desc":"A hot-weather season centered on hydration, travel, beach trips, outdoor activities, and cooling essentials.","calDate":"yearly:03-01","calDateEnd":"yearly:05-31","months":[],"products":[]},{"id":"ksvebke","name":"Holy Week/Lenten ","date":"Mar","type":"seasonal","color":"#22C55E","desc":"A reflective season often connected to family time, travel, staycations, and home-cooked meals.","calDate":"yearly:03-21","calDateEnd":"yearly:03-27","months":[],"products":[]},{"id":"qn9rxk2","name":"Labor Day","date":"May 1","type":"holiday","color":"#EF4444","desc":"Practical everyday essentials, work-from-home items, office tumblers, lunchware, and employee gift ideas.","calDate":"yearly:05-01","calDateEnd":null,"months":[],"products":[]},{"id":"4mzzpcq","name":"National Heroes Day","date":"Aug 31","type":"holiday","color":"#EF4444","desc":"Appreciation campaigns for everyday heroes: teachers, parents, workers, delivery riders, and homemakers.","calDate":"yearly:08-31","calDateEnd":null,"months":[],"products":[]},{"id":"mjd6pig","name":"Mental Health/Self Care Month","date":"Oct","type":"seasonal","color":"#22C55E","desc":"A time to prioritize self-care, raise awareness about mental well-being","calDate":"yearly:10-01","calDateEnd":"yearly:10-31","months":[],"products":[]}],"skuItemsExternalCloud":true,"skuItemsExternalCount":3934,"skuItemsCloudChunkCount":16,"skuItemsCloudUpdatedAt":"2026-07-03T03:08:45.130Z"};


function isRecord(value: any) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function compactLocalStorage(localStorageValue: any) {
  if (!isRecord(localStorageValue)) return {};

  const result: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(localStorageValue)) {
    const lowerKey = key.toLowerCase();
    if (!key.startsWith("emdc")) continue;

    // Never mirror backups/history back to Upstash; they are what filled the DB.
    if (lowerKey.includes("backup")) continue;
    if (lowerKey.includes("history")) continue;
    if (lowerKey.includes("last_good")) continue;
    if (lowerKey.includes("last-good")) continue;

    // Avoid duplicating huge caches in the main state. The dedicated chunk endpoints handle needed data.
    if (lowerKey.includes("generated_batch_outputs")) continue;
    if (lowerKey.includes("ai_saved_outputs")) continue;
    if (lowerKey.includes("text_saved_outputs")) continue;
    if (lowerKey.includes("protected_sku")) continue;

    const value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue ?? "");
    if (value.length > MAX_LOCAL_STORAGE_VALUE_LENGTH) continue;
    result[key] = value;
  }

  return result;
}

async function hydrateSkuChunks(redis: Redis, data: any) {
  if (!isRecord(data) || !isRecord(data.appState)) return data;

  const appState = data.appState;
  const needsSkuHydration =
    !!appState.skuItemsExternalCloud ||
    Number(appState.skuItemsCloudChunkCount || 0) > 0 ||
    (safeArray(appState.skuItems).length === 0 && Number(appState.skuItemsExternalCount || 0) > 0);

  if (!needsSkuHydration) return data;

  const meta: any = (await redis.get(SKU_META_KEY)) || {};
  const chunkCount = Number(meta.chunkCount || appState.skuItemsCloudChunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > MAX_SKU_CHUNKS) return data;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => redis.get(`${SKU_CHUNK_PREFIX}${index}`))
  );

  const skuItems = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
  if (!skuItems.length) return data;

  return {
    ...data,
    appState: {
      ...appState,
      skuItems,
    },
  };
}

async function hydrateLocalStorageChunks(redis: Redis, data: any) {
  if (!isRecord(data)) return data;

  const meta: any = (await redis.get(LOCAL_STORAGE_META_KEY)) || {};
  const chunkCount = Number(meta.chunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > MAX_LOCAL_STORAGE_CHUNKS) return data;

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => redis.get(`${LOCAL_STORAGE_CHUNK_PREFIX}${index}`))
  );

  const rows = chunks.flatMap((chunk: any) => Array.isArray(chunk) ? chunk : []);
  if (!rows.length) return data;

  const partsByKey: Record<string, any[]> = {};
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const key = String(row.key || "");
    if (!key.startsWith("emdc")) continue;
    if (!partsByKey[key]) partsByKey[key] = [];
    partsByKey[key].push(row);
  }

  const restored: Record<string, string> = {};
  for (const [key, parts] of Object.entries(partsByKey)) {
    const sorted = parts.sort((a: any, b: any) => Number(a.partIndex || 0) - Number(b.partIndex || 0));
    const partCount = Number(sorted[0]?.partCount || sorted.length);
    if (sorted.length < partCount) continue;
    restored[key] = sorted.slice(0, partCount).map((part: any) => String(part.valuePart || "")).join("");
  }

  return {
    ...data,
    localStorage: {
      ...(isRecord(data.localStorage) ? data.localStorage : {}),
      ...restored,
    },
  };
}

async function hydrateCloudData(redis: Redis, data: any) {
  const withSku = await hydrateSkuChunks(redis, data);
  return hydrateLocalStorageChunks(redis, withSku);
}

async function batchDelete(redis: Redis, keys: string[]) {
  const unique = Array.from(new Set(keys.filter(Boolean)));
  let deleted = 0;
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    if (!batch.length) continue;
    try {
      const result = await (redis as any).del(...batch);
      deleted += Number(result || 0);
    } catch {
      for (const key of batch) {
        try {
          const result = await redis.del(key);
          deleted += Number(result || 0);
        } catch {}
      }
    }
  }
  return deleted;
}

async function deleteEmdcCloudKeys(redis: Redis) {
  const keys = new Set<string>([
    STATE_KEY,
    SKU_META_KEY,
    LOCAL_STORAGE_META_KEY,
    LAST_GOOD_KEY,
    HISTORY_INDEX_KEY,
  ]);

  // Delete exact known chunk ranges. This avoids needing Redis SCAN/KEYS support.
  for (let i = 0; i < MAX_SKU_CHUNKS; i++) keys.add(`${SKU_CHUNK_PREFIX}${i}`);
  for (let i = 0; i < MAX_LOCAL_STORAGE_CHUNKS; i++) keys.add(`${LOCAL_STORAGE_CHUNK_PREFIX}${i}`);

  // Delete known history backup keys if the index still exists.
  try {
    const historyKeys = await redis.lrange(HISTORY_INDEX_KEY, 0, 500);
    for (const key of safeArray(historyKeys)) {
      const clean = String(key || "");
      if (clean.startsWith(HISTORY_PREFIX)) keys.add(clean);
    }
  } catch {}

  // If Upstash supports KEYS on this database, remove any other old EMDC backup/chunk keys too.
  try {
    const patternKeys = await (redis as any).keys("emdc:app-state:v1*");
    for (const key of safeArray(patternKeys)) {
      const clean = String(key || "");
      if (clean.startsWith("emdc:app-state:v1")) keys.add(clean);
    }
  } catch {}

  const deleted = await batchDelete(redis, Array.from(keys));
  return { attempted: keys.size, deleted };
}


async function deleteAllCloudKeys(redis: Redis) {
  const keys = new Set<string>();

  // This is an emergency reset for this EMDC Redis database.
  // It removes every key in the database so the normal-browser localStorage can republish a clean online copy.
  try {
    const allKeys = await (redis as any).keys("*");
    for (const key of safeArray(allKeys)) {
      const clean = String(key || "");
      if (clean) keys.add(clean);
    }
  } catch {}

  // Also include known EMDC ranges in case KEYS is limited.
  keys.add(STATE_KEY);
  keys.add(SKU_META_KEY);
  keys.add(LOCAL_STORAGE_META_KEY);
  keys.add(LAST_GOOD_KEY);
  keys.add(HISTORY_INDEX_KEY);
  for (let i = 0; i < MAX_SKU_CHUNKS; i++) keys.add(`${SKU_CHUNK_PREFIX}${i}`);
  for (let i = 0; i < MAX_LOCAL_STORAGE_CHUNKS; i++) keys.add(`${LOCAL_STORAGE_CHUNK_PREFIX}${i}`);

  const deleted = await batchDelete(redis, Array.from(keys));
  return { attempted: keys.size, deleted };
}

export async function GET(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "current";

    if (mode === "history") {
      return NextResponse.json({ ok: true, mode, keys: [] });
    }

    if (mode === "last-good") {
      const data:any = await redis.get(LAST_GOOD_KEY);
      return NextResponse.json({ ok: true, mode, data: data ? await hydrateCloudData(redis, data) : {
        version:1,
        updatedAt:new Date().toISOString(),
        appState:RECOVERY_APP_STATE,
        localStorage:{}
      } });
    }

    const data:any = await redis.get(STATE_KEY);
    const hydrated:any = data ? await hydrateCloudData(redis, data) : emptyState;
    const appState:any = hydrated?.appState || {};
    const isEmpty = (!appState || typeof appState !== "object" || (
      (!Array.isArray(appState.checklistGroups) || appState.checklistGroups.length === 0) &&
      (!Array.isArray(appState.calendarEvents) || appState.calendarEvents.length === 0) &&
      (!Array.isArray(appState.seasonalEvents) || appState.seasonalEvents.length === 0) &&
      (!Number(appState.skuItemsExternalCount || 0))
    ));
    if (isEmpty && RECOVERY_APP_STATE && Object.keys(RECOVERY_APP_STATE).length) {
      return NextResponse.json({ ok: true, mode: "current", data: {
        version:1,
        updatedAt:new Date().toISOString(),
        appState:RECOVERY_APP_STATE,
        localStorage:{}
      }});
    }
    return NextResponse.json({ ok: true, mode: "current", data: hydrated });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to read EMDC state from Redis.", data: emptyState },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "";
    const body = await req.json().catch(() => ({}));

    if (mode === "cleanup-all-cloud" || body?.mode === "cleanup-all-cloud") {
      const result = await deleteAllCloudKeys(redis);
      return NextResponse.json({ ok: true, mode: "cleanup-all-cloud", ...result });
    }

    if (mode === "cleanup-cloud" || body?.mode === "cleanup-cloud") {
      const result = await deleteEmdcCloudKeys(redis);
      return NextResponse.json({ ok: true, mode: "cleanup-cloud", ...result });
    }

    if (mode === "sku-chunk" || body?.mode === "sku-chunk") {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const rows = safeArray(body?.rows);
      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total || total > MAX_SKU_CHUNKS) {
        return NextResponse.json({ ok: false, error: "Invalid SKU chunk index." }, { status: 400 });
      }

      // When a new upload begins, clear stale SKU chunks so counts do not drift.
      if (index === 0) {
        const staleKeys = Array.from({ length: MAX_SKU_CHUNKS }, (_, i) => `${SKU_CHUNK_PREFIX}${i}`);
        await batchDelete(redis, staleKeys);
      }

      await Promise.all([
        redis.set(`${SKU_CHUNK_PREFIX}${index}`, rows),
        redis.set(SKU_META_KEY, {
          version: 1,
          clientId: body?.clientId || "",
          updatedAt: body?.updatedAt || new Date().toISOString(),
          chunkCount: total,
          totalItems: Number(body?.totalItems || 0),
        }),
      ]);

      return NextResponse.json({ ok: true, mode: "sku-chunk", index, total, count: rows.length });
    }

    if (mode === "local-storage-chunk" || body?.mode === "local-storage-chunk") {
      return NextResponse.json({ ok: true, mode: "local-storage-chunk", disabled: true, count: 0 });
    }

    if (false) {
      const index = Number(body?.index);
      const total = Number(body?.total);
      const rows = safeArray(body?.rows).filter((row: any) => {
        const key = String(row?.key || "").toLowerCase();
        return key.startsWith("emdc") && !key.includes("backup") && !key.includes("history") && !key.includes("last_good") && !key.includes("last-good");
      });

      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total <= 0 || index >= total || total > MAX_LOCAL_STORAGE_CHUNKS) {
        return NextResponse.json({ ok: false, error: "Invalid local storage chunk index." }, { status: 400 });
      }

      // When a new upload begins, clear stale local-storage chunks.
      if (index === 0) {
        const staleKeys = Array.from({ length: MAX_LOCAL_STORAGE_CHUNKS }, (_, i) => `${LOCAL_STORAGE_CHUNK_PREFIX}${i}`);
        await batchDelete(redis, staleKeys);
      }

      await Promise.all([
        redis.set(`${LOCAL_STORAGE_CHUNK_PREFIX}${index}`, rows),
        redis.set(LOCAL_STORAGE_META_KEY, {
          version: 1,
          clientId: body?.clientId || "",
          updatedAt: body?.updatedAt || new Date().toISOString(),
          chunkCount: total,
          totalKeys: Number(body?.totalKeys || 0),
          totalRows: Number(body?.totalRows || 0),
        }),
      ]);

      return NextResponse.json({ ok: true, mode: "local-storage-chunk", index, total, count: rows.length });
    }

    const incomingAppState = isRecord(body?.appState) ? body.appState : {};
    const incomingIsEmpty =
      (!Array.isArray((incomingAppState as any).checklistGroups) || (incomingAppState as any).checklistGroups.length === 0) &&
      (!Array.isArray((incomingAppState as any).calendarEvents) || (incomingAppState as any).calendarEvents.length === 0) &&
      (!Array.isArray((incomingAppState as any).seasonalEvents) || (incomingAppState as any).seasonalEvents.length === 0) &&
      (!Number((incomingAppState as any).skuItemsExternalCount || 0));

    if (incomingIsEmpty) {
      const existing:any = await redis.get(STATE_KEY);
      if (existing?.appState) {
        return NextResponse.json({ ok: false, blocked: true, error: "Blocked empty state overwrite.", data: existing }, { status: 409 });
      }
    }

    const payload = {
      version: 1,
      clientId: body?.clientId || "",
      updatedAt: body?.updatedAt || new Date().toISOString(),
      appState: incomingAppState,
      localStorage: {},
    };

    await redis.set(STATE_KEY, payload);

    // Keep one small recoverable pointer only. Do not create history backups on the free Redis quota.
    await redis.set(LAST_GOOD_KEY, payload);

    return NextResponse.json({ ok: true, data: payload });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to save EMDC state to Redis." },
      { status: 500 }
    );
  }
}
