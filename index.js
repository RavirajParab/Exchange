
const yargs =require('yargs');
const Confirm = require('prompt-confirm');
const utilities =require('./utilities');


// set the yargs commands
const argv = yargs.command('timing','Fetches the best timing for shorting',{})
                  .command('short','Evaluates your short strategy',{})
                 .help()
                 .argv;

//put the ursl here
const command =argv._[0];
if(command==='timing'){
    new Confirm('Do you want to find best timing for shorting?')
    .ask((answer)=> {
      if(answer){
          //do that activity
         utilities.getTiming();
      }else{
          console.log('Exiting.....');
          process.exit(0);
      }
    });
}if(command==='short'){
    new Confirm('Do you want to begin short evaluation?')
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
