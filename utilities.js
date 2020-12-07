//imports
const fetch = require('node-fetch');
const shortSymbols = require('./short.json');
const {data} = require('./data');
const slfactor =0.006;
const targetfactor=0.007;
const inv=100000;
const taxFactor =0.000415;

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
                    PL : Math.round(qty*(shp-sl)-taxFactor*2*inv),
                    Timing : timeSLHitLocal,
                    Qty :qty
                })  ;         
               // break;
            }else if(element.lp<=target){
                const timeTargetHitLocal = new Date(element.ts).toLocaleTimeString();
               
                return({
                    Symbol :i.Symbol,
                    Type :'Target Hit',
                    SP : shp,
                    Price : element.lp,
                    PL : Math.round(qty*(shp-target)-taxFactor*2*inv),
                    Timing : timeTargetHitLocal,
                    Qty :qty
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
                        PL : Math.round(qty*(shp-element.lp) - taxFactor*2*inv),
                        Timing : timeLocal,
                        Qty :qty
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
   // Build BO table
   const BOTable = PlRes.map(i=>{
        return {
            Symbol : i.Symbol,
            SL : (i.SP*slfactor).toFixed(1),
            Target : (i.SP*targetfactor).toFixed(1),
            Price : i.SP,
            Qty : i.Qty
        }
   });
   console.table(BOTable);
   console.table(PlRes);
   const tpl = PlRes.reduce((sum,o)=>sum+o.PL,0);
   console.log(`Total PL is : ${tpl}`);
}


module.exports={
    getExchangeData,
    evaluateShorts
}