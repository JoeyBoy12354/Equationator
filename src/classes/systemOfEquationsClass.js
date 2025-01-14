
import nerdamer from'nerdamer/nerdamer.core.js';
import 'nerdamer/Solve.js';
import { Var_obj,getVariables,isNumber } from "./variableClass.js";
import { Equation,getScopedEquation } from "./equationClass.js";
/*
var:
    this.name = name;
    this.valueStr = "";
    this.valueAsExpressions = [];
    this.val = val;
    this.implicitlyDefined = implicit;
    this.isKnown = isKnown;
eq:
    this.eqStr = inputStr;
    this.isValid = valid;
    this.varNames = varNames;
    this.ndPtr = ndPtr;
    this.statusIndex = statusIndex;
*/
export class System_Of_Equations{

    constructor(){
        this.eqs = [];
        this.vars_obj = new Var_obj();      
        this.calced = false;  
    }

    //variables
    setVarByInput(index,valStr){
        this.vars_obj.implicitlySet(index,valStr);
		this.calced = false;
    }
    clearVarAtIndex(index){
		for(let i =0;i<this.eqs.length;i++){
			if(this.eqs[i].statusIndex == 5){
				if(this.eqs[i].varNames.includes(this.vars_obj.varNames[index])){
					this.eqs[i].statusIndex = 2;
				}
			}
		}
		console.log("On the way to clear "+this.vars_obj.varNames[index]);
        this.vars_obj.clearValue(index);
		this.vars_obj.updateScope();
    }
	clearNonImplicit(){
        for(let i =0;i<this.vars_obj.variables.length;i++){
            if(!this.vars_obj.variables[i].implicit){
				this.clearVarAtIndex(i);
            }
        }
    }
	considerVarDiscontinuation(var_name,excludeIndex = -1){
		let found = false;
		for (let i =0;i<this.eqs.length;i++){
			if(i != excludeIndex){
				for(let j =0;j<this.eqs[i].varNames.length;j++){
					if(var_name == this.eqs[i]['varNames'][j]){
						found = true;
						break;
					}
				}
			}
		}
		if(!found){//delete var
			let delIndex = -1;
			for(let i =0;i<this.vars_obj.varNames.length;i++){
				if(var_name==this.vars_obj.varNames[i]){
					delIndex = i;
					break;
				}
			}
			this.vars_obj.deleteAtIndex(delIndex);
			this.calced = false;
		}
	}
    //equations
    addEmptyEquation(){
        this.eqs.push(new Equation());
    }
	deleteEqAtIndex(index){
		let eqVars = this.eqs[index].varNames;
		this.eqs.splice(index,1);
		console.log("Enters deleteEqAtIndex with eqVars = ");
		console.log(eqVars);
		for(let i = 0;i<eqVars.length;i++){
			this.considerVarDiscontinuation(eqVars[i]);
			console.log('past this.considerVarDiscontinuation of '+eqVars[i]+', current ');
			console.log(this.vars_obj.varNames);
			
		}
	}
    editEqInputStr(str,index){
		let oldVars = this.eqs[index].varNames;
        this.eqs[index].setNewEquationStr(str);//updates statusIndex and Validity
        if(this.eqs[index].isValid){
			this.statusIndex = 2;
			let eqVars = this.eqs[index].varNames;
			for(let i =0;i<eqVars.length;i++){
				console.log(eqVars[i]);
				if(!(this.vars_obj.varNames.includes(eqVars[i] ))){
					this.vars_obj.add(eqVars[i])
				}
			}
			this.calced = false;       
			this.clearNonImplicit();   
        }
		for(let i =0;i<oldVars.length;i++){
			if(!this.eqs[index].varNames.includes(oldVars[i])){
				this.considerVarDiscontinuation(oldVars[i]);
			}
		}
    }
	setValBySolving(index,val){
		this.vars_obj.variables[index].val = val;
		this.vars_obj.variables[index].isKnown = true;
		this.vars_obj.variables[index].valueAsExpression = this.vars_obj.variables[index].val;		
		this.vars_obj.variables[index].valueStr = this.vars_obj.variables[index].val;
	}	

   //new stuff
	getSimilarEquations(n,eqID){
		let testVars = this.eqs[eqID].varNames; //replaced .unknowns
		let ret = [];
		for (let i =0;i<this.eqs.length;i++){
			if (i != eqID){
				if(this.eqs[i].varNames.length <= n){//replaced .unknowns
					let sharedVarCount = this.eqs[i].getAmountSharedVariables(testVars);
					let entry = {'count': sharedVarCount,'eqID':i};
					ret.push(entry);
				}
			}
		}
		for (let i =0;i<ret.length-1;i++){
			let swapped = false;
			for (let j = i+1;j<ret.length;j++){
				if(ret[j-1].count<ret[j].count){
					swapped = true;
					let temp = ret[j-1];
					ret[j-1] = ret[j];
					ret[j] = temp;
				}
			}
			if (!swapped)break;			
		}
		return ret;
	}
	
	trySimEqSolution(eqArr){
		//insert equations and return answer or err
		console.log("Attempting Solution With:")
		for(let i=0;i<eqArr.length;i++){
			console.log("eqArr4Solve["+i+"] = "+eqArr[i]);
		}
		
		if (eqArr.length ==1){
			console.log("code D");
			try{
				console.log("code F");
				console.log
				let ans = nerdamer.solveEquations(eqArr);
				console.log("!ANSWER HAS BEEN FOUND!")
				console.log(ans);

				console.log("code G");
				console.log("code H");

				if(Array.isArray(ans)){return ans[0];}
				if(!ans.isNumber()){throw 'ans not number';}
				this.setValBySolving(this.vars_obj.getVarIndex(ans[0][0]), ans[0][1])	
				return ans;
			}catch(err){
				console.log(err)
				return err;
			}
		}
		else{
			try{



				let ans = nerdamer.solveEquations(eqArr);
				console.log("!ANSWER HAS BEEN FOUND!")
				console.log(ans);
				for (let i =0;i<ans.length;i++){
					this.setValBySolving(this.vars_obj.getVarIndex(ans[i][0]), ans[i][1])	
				}
				return ans;
			}catch(err){
				console.log(err);
				return err;
			}
		}
	}

	 //system
    solveAndUpdate(){

        console.log("Entered solveAndUpdate");
		if(this.calced){
			console.log('already solved, make change first');
			return;
		}
		this.clearNonImplicit();
		this.calced = false;
		console.log("pressed solve");

		let unknowns = this.vars_obj.getUnknownVarNames();
		for (let n = 1;n<=unknowns.length;n++){
			console.log("S&U_fLoop 1: n=" + n + ", unknowns.length=" + unknowns.length);
			for(let eqID=0;eqID<this.eqs.length;eqID++){
				console.log("S&U_fLoop 2: eqID=" + eqID + ", eqs.length=" + this.eqs.length);

				if(this.eqs[eqID].varNames.length <= n){
					let simEqs = this.getSimilarEquations(n,eqID);//[{count,eqID}]
					let activeSimEqs = [];
					activeSimEqs[0] =getScopedEquation(
						this.vars_obj.scope,
						this.eqs[eqID].eqStr
						);
					
					
					if(simEqs.length==0){
						//only 1 eq
						try{
							ans = this.trySimEqSolution(activeSimEqs);
							n=0;
							break;
						}catch(err){
							console.log("Chief this boy does not allow for a solution");
							console.log(err);
						}	
					}else{
						//>1 eq
						for(let i=0;i<simEqs.length;i++){
					
							activeSimEqs.push(
								getScopedEquation(
									this.vars_obj.scope,
									this.eqs[simEqs[i].eqID].eqStr
								)
							);


							try{
								ans = this.trySimEqSolution(activeSimEqs);
								n=0;
								break;
							}catch(err){
								console.log("Chief these boys do not allow for a solution");
								console.log(err);
							}	
						}
					}
					

				}
			}
		}
    }
}




/*
		for(let i =0;i<this.vars_obj.varNames.length;i++){
			console.log("looking at "+this.vars_obj.varNames[i]+" to solve");
			console.log("Known status of "+this.vars_obj.varNames[i]+" "+this.vars_obj.variables[i].isKnown);
			if(!this.vars_obj.variables[i].isKnown){
				console.log(this.vars_obj.varNames[i]+" is not known");
				let found = false;
				for(let eqIndex =0;eqIndex <this.eqs.length;eqIndex++){
					console.log("");
					if(this.eqs[eqIndex].statusIndex == 2){
						console.log("eq "+eqIndex+" has SI of "+this.eqs[eqIndex].statusIndex);
						console.log(this.vars_obj.varNames[i]+" in "+this.eqs[eqIndex].varNames);
						if(this.eqs[eqIndex].varNames.includes(this.vars_obj.varNames[i])){
							
							if(!found){
								found = true;
								let value = null;
								try{
									console.log("in found try");
									console.log("solving for "+this.vars_obj.varNames[i]+" in "+this.eqs[eqIndex].eqStr +" with the result: ");
									value = nerdamer.solveEquations(this.eqs[eqIndex].eqStr,this.vars_obj.varNames[i]);
									console.log(value);
									if(Array.isArray(value)){
										console.log("val first index: ");
										console.log(value[0]);
										console.log("1");
										if(isNumber(value[0],scope)){			
											console.log("1.1");
											this.eqs[eqIndex].statusIndex = 5;
											this.setValBySolving(i,nerdamer(value[0]).evaluate(scope));
											
											console.log("Assigning "+this.vars_obj.varNames[i]+" to "+this.vars_obj.variables[i].val);
											console.log("Scope = ");
											console.log(scope);
											i=0;		
											console.log("Set "+this.vars_obj.varNames[i]+" to known");
											break;
										}else{
											console.log("1.2");		
											console.log("The not number:");
											console.log(value[0]);
											indexesToSimultaneouslySolvePerVariable[this.vars_obj.varNames[i]] = [eqIndex];
										}
									}else{
										console.log("2");
										if(isNumber(value,scope)){
											console.log("2.1");
											this.eqs[eqIndex].statusIndex = 5;
											this.setValBySolving(i,nerdamer(value[0]).evaluate(scope)); 
											console.log("Set "+this.vars_obj.varNames[i]+" to known");
											i=0;								
											break;
										}else{
											console.log("2.2");
											indexesToSimultaneouslySolvePerVariable[this.vars_obj.varNames[i]] = [eqIndex];
										}
									}
								}catch(e){
									throw e;
								}
								//gees se iets is nie lekker nie							
							}else{
								try{
									console.log("in !found try");
									let value = nerdamer.solveEquations(this.eqs[eqIndex].eqStr,this.vars_obj.varNames[i]);
									if(Array.isArray(value)){
										console.log("1");
										if(isNumber(value[0],scope)){		
											console.log("1.1");			
											this.eqs[eqIndex].statusIndex = 5;
											this.setValBySolving(i,nerdamer(value[0]).evaluate(scope));
											i=0;				
											indexesToSimultaneouslySolvePerVariable[this.vars_obj.varNames[i]] = [];
											console.log("Set "+this.vars_obj.varNames[i]+" to known");
											break;
										}else{		
											console.log("1.2");			
											indexesToSimultaneouslySolvePerVariable[this.vars_obj.varNames[i]].push(eqIndex);
										}
									}else{
										console.log("2");
										if(isNumber(value,scope)){
											console.log("2.1");
											this.eqs[eqIndex].statusIndex = 5;
											this.setValBySolving(i,nerdamer(value[0]).evaluate(scope));					
											i=0;		
											indexesToSimultaneouslySolvePerVariable[this.vars_obj.varNames[i]] = [];	
											console.log("Set "+this.vars_obj.varNames[i]+" to known");
											break;
										}else{
											console.log("2.2");
											indexesToSimultaneouslySolvePerVariable[this.vars_obj.varNames[i]] = [eqIndex];
										}
									}


								}catch(e){
									throw e;
								}

							}
						}
					}
				}
			}
		}
		let simEqIndexes = indexesToSimultaneouslySolvePerVariable;
		let eqVars = Object.keys(indexesToSimultaneouslySolvePerVariable);
		console.log("Eq Vars to simultaneously solve: ");
		console.log(eqVars);
		console.log(simEqIndexes[eqVars[0]]);
		for(;eqVars.length>0;){
			let simEqStrings = [];
			for(let nthIndex = 0;nthIndex<simEqIndexes[eqVars[0]].length;nthIndex++){
				simEqStrings.push(this.eqs[simEqIndexes[eqVars[0]][nthIndex]].eqStr);
			}
			console.log("simEqStrings");
			console.log(simEqStrings);
			try{
				nerdamer.set('SOLUTIONS_AS_OBJECT', true);
				let res = nerdamer.solveEquations(simEqStrings);
				let vNames = Object.keys(res);
				console.log("res");
				console.log(res);
				for(let i =0;i<vNames.length;i++){
					this.setValBySolving(this.vars_obj.getVarIndex(vNames[i]),res[vNames[i]]);
				}
				nerdamer.set('SOLUTIONS_AS_OBJECT', false);
				for(let i = 0;i<eqVars.length;i++){
					if(vNames.includes(eqVars[i])){
						eqVars.splice(i,1);
						i--;
					}
				}
			}catch(e){
				console.log(e);
			}
			eqVars.splice(0,1);
		}
		console.log("Indexes To Simultaneously Solve per Variable: ");
		console.log(indexesToSimultaneouslySolvePerVariable);

		//do simultaneously solve
		*/



console.log("loaded systemOfEquationsClass");