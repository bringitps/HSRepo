/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Oct 2016     seko
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord salesorder
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord(){
	var soid = nlapiGetRecordId();
	var sotext = nlapiGetFieldValue('tranid');
	var po = nlapiGetFieldValue('otherrefnum');
	if (po!=null && po!=''){
		var associated = hasAssociatedSO(po,sotext);
		if (associated){
			var agree = true;
			agree = false;
			var response = '';
			while (agree==false) {
				response = prompt("The CUSTOMER PO # you are using is already associated with an existing Sales Order, do you wish to continue? Type 'y' to accept, type 'n' to cancel.", '');
				agree = (response == 'y');
				if (response =='n'){
					return false;
				}
				if (response == 'y'){
					return true;
				}
			}
		}
	}
	return true;

}

function hasAssociatedSO(po_num,sotext){
	var result = null;
	var filter=new Array();
	filter.push(new nlobjSearchFilter('otherrefnum',null,'equalto', po_num));
	filter.push(new nlobjSearchFilter('tranid', null, 'isnot', sotext)); 
	filter.push(new nlobjSearchFilter('mainline',null,'is','T'));
	var columns=new Array();	 
	columns.push(new nlobjSearchColumn('tranid'));
	columns.push(new nlobjSearchColumn('otherrefnum'));
	result=nlapiSearchRecord('salesorder',null,filter,columns);
    if(result != null){
    	return true;
    }else{
    	return false;
    }

}