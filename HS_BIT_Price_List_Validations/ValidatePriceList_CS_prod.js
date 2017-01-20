/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Apr 2016     Admin
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord(){
	if(nlapiGetFieldValue('custrecord_pl_customer') && nlapiGetFieldValue('custrecord_pl_customer_type')){
		alert('Both Customer and Customer Type cannot be populated for the same record.');
		return false;
	}
	
	if(!nlapiGetFieldValue('custrecord_pl_customer') && !nlapiGetFieldValue('custrecord_pl_customer_type')){
		alert('Either Customer or Customer Type must be populated for this record.');
		return false;
	}
	
	
	var customerOrCustomerType = (nlapiGetFieldValue('custrecord_pl_customer')) ? 'custrecord_pl_customer' : 'custrecord_pl_customer_type';
	
	var filterExpression = [ 
        [ 'custrecord_pl_item', 'anyof', nlapiGetFieldValue('custrecord_pl_item') ],
        'and',
        [customerOrCustomerType, 'anyof', nlapiGetFieldValue(customerOrCustomerType)]
    ];
	
	console.log(nlapiGetRecordId());
	
	//If we're updating a record, then we should omit this record from our search results. 
	if(nlapiGetRecordId()){
		filterExpression.push('and');
		filterExpression.push(['internalid', 'noneof', nlapiGetRecordId()]);
	}	
	
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_pl_start_date');
	columns[1] = new nlobjSearchColumn('custrecord_pl_end_date');
	
	var searchResults;
	
	try{
		searchResults= nlapiSearchRecord('customrecord_price_list', null, filterExpression, columns);
	}catch(e){
		console.log(e);
		nlapiLogExecution('DEBUG', 'search error', e);
	}
	
	startA = Date.parse(nlapiGetFieldValue('custrecord_pl_start_date'));
	endA = Date.parse(nlapiGetFieldValue('custrecord_pl_end_date'));		
	
	//Check that start date comes before end date. 
	if(startA > endA){
		alert('Start Date must begin before End Date.');
		return false;
	}	
	
	if(searchResults){		
		for(var i = 0; i < searchResults.length; i++){
			result = searchResults[i];
			
			startB = Date.parse(result.getValue('custrecord_pl_start_date'));
			endB = Date.parse(result.getValue('custrecord_pl_end_date'));
			
			
			if((startA <= endB) && (endA >= startB)){
				alert('Price for that date range already exists for this item.');
				return false;
//				throw nlapiCreateError('DATE_RANGE', 'Price for that date range already exists for this item.', true);
			}
		}		
	}	
	
	
    return true;
}
