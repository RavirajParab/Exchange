
const yargs =require('yargs');
const Confirm = require('prompt-confirm');
const utilities =require('./utilities');


// set the yargs commands
const argv = yargs.command('fetch','Fetches the stock prices from ticker',{})
                  .command('short','Evaluates your short strategy',{})
                 .help()
                 .argv;

//put the ursl here
const command =argv._[0];
if(command==='fetch'){
    const confirm = new Confirm('Do you want to fetch secutity data?')
    .ask((answer)=> {
      if(answer){
          //do that activity
         utilities.getExchangeData();
      }else{
          console.log('Exiting.....');
          process.exit(0);
      }
    });
}if(command==='short'){
    const confirm = new Confirm('Do you want to begin short evaluation?')
    .ask((answer)=> {
      if(answer){
          //do that activity
         utilities.evaluateShorts();
      }else{
          console.log('Exiting.....');
          process.exit(0);
      }
    });
}
else {
    console.log('Command not recognized!')
}
