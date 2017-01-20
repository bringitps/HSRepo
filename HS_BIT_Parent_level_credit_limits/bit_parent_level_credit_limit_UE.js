/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Nov 2016     seko
 * BIT Parent Level Credit Limit UE -> customscript_bit_parent_lvl_crdlimit_ue
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function beforeApproval(type){
	if(type == 'approve'){
		nlapiLogExecution('debug','validateCreditLimit on approve','');
		var soid = nlapiGetRecordId();
		// if the order is going to be approved that means that its amount was already added to the consolunbilledorders field on the customer when the order was created. 
		// so we wont need to add the SO amount.
		//var soamount = (nlapiGetFieldValue('total')!=null && nlapiGetFieldValue('total')!='') ? nlapiGetFieldValue('total') : 0;
		var custid = nlapiGetFieldValue('entity');
		if (custid!=null & custid!=''){
			var customer = nlapiLoadRecord('customer',custid);
			var hasParent = customer.getFieldValue('hasparent');
			if(hasParent == 'T'){
				var parentid = customer.getFieldValue('parent');
				customer = nlapiLoadRecord('customer',parentid);
			}
			var hold = customer.getFieldValue('creditholdoverride');
			if (hold == 'ON'){
				throw nlapiCreateError('Error','Cannot Approve. Main Customer is on HOLD',true);
			}else{
		
				var creditLimit = (customer.getFieldValue('creditlimit')!=null && customer.getFieldValue('creditlimit')!='') ? customer.getFieldValue('creditlimit') : 0;
				var consolBalance = (customer.getFieldValue('consolbalance')!=null && customer.getFieldValue('consolbalance')!='') ? customer.getFieldValue('consolbalance') : 0;
				var unbilled = (customer.getFieldValue('consolunbilledorders')!=null && customer.getFieldValue('consolunbilledorders')!='') ? customer.getFieldValue('consolunbilledorders') : 0;
				nlapiLogExecution('debug','consolBalance + unbilled',parseFloat(consolBalance)+parseFloat(unbilled));
				var futureConsolBalance = (parseFloat(consolBalance) + parseFloat(unbilled));
				if (futureConsolBalance  > creditLimit ){
					//return confirm('This customer is over the credit limit, do you wish to continue?');
					throw nlapiCreateError('Error','Cannot Approve. Exceeds credit limit',true);
				}
			}
		}
	}
}
