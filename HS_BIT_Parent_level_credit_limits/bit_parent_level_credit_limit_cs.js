/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Oct 2016     seko
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function onLoad(type){
	var soid = nlapiGetRecordId();
	var custid = nlapiGetFieldValue('entity');
	if (custid!=null & custid!=''){
		var customer = nlapiLoadRecord('customer',custid);
		var hasParent = customer.getFieldValue('hasparent');
		nlapiLogExecution('debug','hasparent?',hasParent);
		if(hasParent == 'T'){
			var parentid = customer.getFieldValue('parent');
	        customer = nlapiLoadRecord('customer',parentid);
	        nlapiLogExecution('debug','parentid',parentid);
		}
		var creditLimit = (customer.getFieldValue('creditlimit')!=null && customer.getFieldValue('creditlimit')!='') ? customer.getFieldValue('creditlimit') : 0;
		var consolBalance = (customer.getFieldValue('consolbalance')!=null && customer.getFieldValue('consolbalance')!='') ? customer.getFieldValue('consolbalance') : 0;
		var unbilled = (customer.getFieldValue('consolunbilledorders')!=null && customer.getFieldValue('consolunbilledorders')!='') ? customer.getFieldValue('consolunbilledorders') : 0;
		nlapiLogExecution('debug','creditLimit',creditLimit);
		nlapiLogExecution('debug','consBalance',consolBalance);
		nlapiLogExecution('debug','unbilledOrders',unbilled);
		if ((parseFloat(consolBalance)+parseFloat(unbilled)) > parseFloat(creditLimit)){
			nlapiLogExecution('debug','creditLimitExceeded!','');
			alert('This customer is over the credit limit');
		}
	}
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function validateCreditLimit(type){
	
	var newConsolBalance =null;
	var isNew = false;
	var soid = nlapiGetRecordId();
	if (soid!=null && soid !='' ){
		var oldso= nlapiLoadRecord('salesorder',soid);
		var oldsoamount= (oldso.getFieldValue('total')!=null && oldso.getFieldValue('total')!='') ? oldso.getFieldValue('total') : 0;
		nlapiLogExecution('debug','Old Amount:',oldsoamount);
	}else{
		isNew = true;
	}
	var soamount = (nlapiGetFieldValue('total')!=null && nlapiGetFieldValue('total')!='') ? nlapiGetFieldValue('total') : 0;
	
	nlapiLogExecution('debug','New Amount:',soamount);
	var flagTotalChanged = false;
	if (isNew){
		flagTotalChanged = false;
	}else{
		if(oldsoamount != soamount){
			nlapiLogExecution('debug','Amount changed','YES');
			flagTotalChanged = true;
		}
	}
	var custid = nlapiGetFieldValue('entity');
	if (custid!=null & custid!=''){
		var customer = nlapiLoadRecord('customer',custid);
		var hasParent = customer.getFieldValue('hasparent');
		if(hasParent == 'T'){
			var parentid = customer.getFieldValue('parent');
			customer = nlapiLoadRecord('customer',parentid);
		}
		var creditLimit = (customer.getFieldValue('creditlimit')!=null && customer.getFieldValue('creditlimit')!='') ? customer.getFieldValue('creditlimit') : 0;
		var consolBalance = (customer.getFieldValue('consolbalance')!=null && customer.getFieldValue('consolbalance')!='') ? customer.getFieldValue('consolbalance') : 0;
		var unbilled = (customer.getFieldValue('consolunbilledorders')!=null && customer.getFieldValue('consolunbilledorders')!='') ? customer.getFieldValue('consolunbilledorders') : 0;
		nlapiLogExecution('debug','ConsolUnbilled is ',unbilled);
		if(flagTotalChanged){
			unbilled = parseFloat(unbilled) - parseFloat(oldsoamount);
			nlapiLogExecution('debug','ConsolUnbilled adjusted to: ',unbilled);
			nlapiLogExecution('debug','consolBalance + ConsolUnbilled',parseFloat(consolBalance)+parseFloat(unbilled));
			newConsolBalance = (parseFloat(consolBalance) + parseFloat(unbilled) + parseFloat(soamount));
		}else{
			nlapiLogExecution('debug','consolBalance + ConsolUnbilled',parseFloat(consolBalance)+parseFloat(unbilled));
			newConsolBalance = (parseFloat(consolBalance) + parseFloat(unbilled));
		}
		nlapiLogExecution('debug','newConsolBalance is :'+newConsolBalance);
		if (newConsolBalance  > creditLimit ){
		 return confirm('This customer is over the credit limit, do you wish to continue?');
		}
	}
	return true;
}
