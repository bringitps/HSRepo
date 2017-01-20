/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       01 Nov 2016     seko
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord Message
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type){

	var id = nlapiGetFieldValue('transaction');
	nlapiLogExecution('error','Transaction ID..',id);
	if (id!=null && id!=''){
		var record = null;
		try{
			record = nlapiLoadRecord('purchaseorder',id);
		}catch(Ex)
		{
	        nlapiLogExecution('debug', 'This is not a PO', Ex);
	        record = null;
		}
		if (record != null){
			nlapiLogExecution('debug', 'this is a PO','');
			var po_type = record.getFieldValue('custbody_po_type');
			nlapiLogExecution('error','PO type:',po_type);
			if (po_type == '1'){
				nlapiLogExecution('error','loading file','domestic');
				var pdf =  nlapiLoadFile('Terms and Conditions/Terms_and_Conditions_Domestic.pdf');
				nlapiSelectNewLineItem('mediaitem');
				nlapiSetCurrentLineItemValue('mediaitem','mediaitem',pdf.getId()); 
				nlapiCommitLineItem('mediaitem');
			}else if (po_type == '2'){
				nlapiLogExecution('error','loading file','International');
				var pdf = nlapiLoadFile('Terms and Conditions/Terms_and_Conditions_International.pdf');
				nlapiSelectNewLineItem('mediaitem');
				nlapiSetCurrentLineItemValue('mediaitem','mediaitem',pdf.getId()); 
				nlapiCommitLineItem('mediaitem');
			}
		}
	}	
	

}

