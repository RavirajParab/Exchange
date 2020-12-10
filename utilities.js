//imports
const fetch = require('node-fetch');
const {RSI} =require('technicalindicators');
const shortSymbols = require('./short.json');
const {data} = require('./data');
const slfactor =0.005;
const targetfactor=0.009;
const inv=100000;
const taxFactor =0.000415;
const rsiPeriod =14;
//const startingTime ="04:40:00.000Z";
//const endingTime ="09:00:00.000Z";
const startingTime ="05:35:00.000Z";
const endingTime ="10:00:00.000Z";

const getTiming =async ()=>{
    const nif200Url = `https://api.tickertape.in/stocks/charts/intra/.NIFTY200`;
    const nifProm = await fetch(nif200Url);
    const nifData = await nifProm.json();
    const dataPoints = nifData.data[0].points;
    const inputRSI ={
        values : dataPoints.map(i=>i.lp),
        period:rsiPeriod
    }
    const result = RSI.calculate(inputRSI);
    const compositeRSIData = result.map((i,index)=>{
        return {
            RSI : i,
            TS : new Date(dataPoints[index+rsiPeriod].ts).toLocaleTimeString(),
            TSZ : dataPoints[index+rsiPeriod].ts,
            LP : dataPoints[index+rsiPeriod].lp
        }
    });
    const shortTingOpps = compositeRSIData.filter(i=>i.RSI>70);
    const buyingOpps = compositeRSIData.filter(i=>i.RSI<28);
    
}

const getPLForSymbol =async (i)=>{
    try{
        const sid=i.sid;
        if(sid){
            const intraDataUrl =`https://api.tickertape.in/stocks/charts/intra/${sid}?dt=${new Date().toString()}`;
            const sidProm = await fetch(intraDataUrl);
            const sidData = await sidProm.json();
            //new logic
            let fi=sidData.data[0].points.findIndex(i=>i.ts.split('T')[1]===startingTime);
            if(fi==-1){
                fi=0;
            }
            
            
            const fid=sidData.data[0].points.slice(fi);
            const si = fid.findIndex(i=>i.ts.split('T')[1]===endingTime);
            if(si>-1){
                fid.splice(si-fid.length+1);
               // console.log(fid[0]);
               // console.log(fid[fid.length-1]);
            }
           
            
            //find the shorting Price
            const shp= fid[0].lp;
            const sl= shp+slfactor*shp;
            const target = shp-targetfactor*shp;
            const qty = Math.round(inv/shp);
            const pl=0;
            for (let index = 0; index < fid.length; index++) {
                const element = fid[index];
                
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
                }
                
                else if(element.lp<=target){
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
                }
                
                else{
                    if(index===fid.length-1){
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
       
    }catch(err){
        console.log(`Error occured for SID ${i.Symbol} and error is ${err}`)
    }
    
}

const evaluateShorts=async ()=>{
    try{
        const sidShorts = data.filter(i=>shortSymbols.includes(i.Symbol));
      //  console.log(sidShorts);
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
        console.log(`Starting time ${new Date(`2020-12-09T${startingTime}`).toLocaleTimeString()}`);
        console.log(`Ending time ${new Date(`2020-12-09T${endingTime}`).toLocaleTimeString()}`);
    }catch(err){
        console.log(err);
    }
  
}


module.exports={
    getTiming,
    evaluateShorts
}