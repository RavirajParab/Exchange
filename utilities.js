//imports
const fetch = require('node-fetch');
const shortSymbols = require('./short.json');
const {data} = require('./data');
const dt= "2020-12-07T04:40:00.000Z"
const startTime =new Date(new Date((new Date).toDateString()).setHours(10,10,0,0));
const slfactor =0.007;
const targetfactor=0.008;
const inv=100000;

const getExchangeData =()=>{
    console.log('Getting exchange data');
}

const getPLForSymbol =async (i)=>{
    const sid=i.sid;
    if(sid){
        const intraDataUrl =`https://api.tickertape.in/stocks/charts/intra/${sid}`;
        const sidProm = await fetch(intraDataUrl);
        const sidData = await sidProm.json();
        let priceTimeData = sidData.data[0].points.slice(53);
        priceTimeData = priceTimeData.splice(0,priceTimeData.length-53);
        
        //find the shorting Price
        const shp= (priceTimeData.filter(i=>i.ts.split('T')[1]==="04:40:00.000Z"))[0].lp;
        const sl= shp+slfactor*shp;
        const target = shp-targetfactor*shp;
        const qty = Math.round(inv/shp);
        const pl=0;
        for (let index = 0; index < priceTimeData.length; index++) {
            const element = priceTimeData[index];
            if(element.lp>=sl){
                const timeSLHitLocal = new Date(element.ts).toLocaleTimeString();
               
                return({
                    Symbol :i.Symbol,
                    Type :'SL Hit',
                    SP : shp,
                    Price : element.lp,
                    PL : Math.round(qty*(shp-sl)),
                    Timing : timeSLHitLocal
                })  ;         
               // break;
            }else if(element.lp<=target){
                const timeTargetHitLocal = new Date(element.ts).toLocaleTimeString();
               
                return({
                    Symbol :i.Symbol,
                    Type :'Target Hit',
                    SP : shp,
                    Price : element.lp,
                    PL : Math.round(qty*(shp-target)),
                    Timing : timeTargetHitLocal
                })  ;    
               // break;
            }else{
                if(index===priceTimeData.length-1){
                    const timeLocal = new Date(element.ts).toLocaleTimeString();

                    return({
                        Symbol :i.Symbol,
                        Type :'Closing',
                        SP : shp,
                        Price : element.lp,
                        PL : Math.round(qty*(shp-element.lp)),
                        Timing : timeLocal
                    })  ;  
                   // break;
                }
            }
        }
    }
}

const evaluateShorts=async ()=>{
   const sidShorts = data.filter(i=>shortSymbols.includes(i.Symbol));
   // loop for sidShorts
   const PlProms=sidShorts.map(x=>getPLForSymbol(x));
   const PlRes = await Promise.all(PlProms);
   console.table(PlRes);
   const tpl = PlRes.reduce((sum,o)=>sum+o.PL,0);
   console.log(`Total PL is : ${tpl}`);
}


module.exports={
    getExchangeData,
    evaluateShorts
}