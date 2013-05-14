var H = require('./H.js');
H.require('UnitTests/packages/Temperature');
H.require('packages/System');

if (H.isDefined(process.argv[2])) { 
	if (!H.isDefined(process.argv[3])) { H.error('ERROR: Input property parameter is not specified');	}
	if (!H.isDefined(process.argv[4])) { H.error('ERROR: Output property parameter is not specified');	}


	var sKind 	= process.argv[2],
		sInput	= process.argv[3],
		sOutput	= process.argv[4],
		oKind 	= H.getKind(sKind),
		oInst;
	
	if (!oKind) { H.error('ERROR: Kind ' + sKind + ' is not found'); }

	oInst = H.getKind(sKind).construct();

	if (!H.isDefined(oInst[sInput]))  { H.error('ERROR: Property ' + sKind + '.' + sInput  + ' does not exist') }
	if (!H.isDefined(oInst[sOutput])) { H.error('ERROR: Property ' + sKind + '.' + sOutput + ' does not exist') }

	process.stdin.resume();
	process.stdin.setEncoding('utf8');

	H.bind(oInst, sInput).to('STDIN');
	H.bind('STDOUT').to(oInst, sOutput);
	
} else {
	
	function run(s) {
		try {
			vm.runInContext(s, oContext, 'myfile.vm');
		} catch (oError) {
			out(oError.message);
		}
	}
	
	function newline() {
		process.stdout.write('\n');
	}
	
	function out(s) {
		process.stdout.write(s.replace('\n', '\n> '));
		newline();
	}
	
	var util 		= require('util'),
	    vm 			= require('vm'),
		sBuffer		= '';
		bSkip		= false;
	    oContext 	= vm.createContext({
			console	: console,
			H		: H
		});

	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	
	process.stdin.on('data', function(sData) {
		sData = sData.trim();
		try {
			vm.runInContext(sData, oContext, 'myfile.vm');
		} catch (oError) {
			console.log(oError.message);
		}
	});
	
}