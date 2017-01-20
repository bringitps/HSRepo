/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Oct 2016     seko
 *
 */

function validateLine(group){
	var shipCountry = nlapiGetFieldValue('shipcountry');
	var recType = nlapiGetRecordType();
	if (recType =='salesorder' && group == 'item' && shipCountry == 'CA'){
		var itemId = nlapiGetCurrentLineItemValue('item', 'item'); 
		var itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
		if(itemId!=null && itemId!=''){
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('type', null, 'anyof', itemType);
			filters[0] = new nlobjSearchFilter('internalid', null, 'is', itemId);
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('custitem_unavailable_for_canada');
			var result = nlapiSearchRecord('item', null, filters, columns);
		    if(result != null){
		    	var flag = result[0].getValue('custitem_unavailable_for_canada');
		    	if (flag == 'T'){
		    		alert('Item selected is not allowed to ship to '+shipCountry);
		    		return false;
		    	}else{
		    		return true;
		    	}
		    }
	    }else{
	    	return true;
	    }
	}

    return true;
}

function fieldChanged(type, name){
	if ((name === 'shipaddresslist') && (nlapiGetFieldValue('shipcountry') === "CA")) {		
		var lines = nlapiGetLineItemCount('item');
		if (lines>0){			
			for ( i = 1 ; i<= lines ; i++ ){
				var itemId = nlapiGetLineItemValue( 'item' , 'item' , i )
				var itemType = nlapiGetLineItemValue( 'item' , 'itemtype' , i )
				if(itemId!=null && itemId!=''){
					var filters = new Array();
					filters[0] = new nlobjSearchFilter('type', null, 'anyof', itemType);
					filters[0] = new nlobjSearchFilter('internalid', null, 'is', itemId);
					var columns = new Array();
					columns[0] = new nlobjSearchColumn('custitem_unavailable_for_canada');
					var result = nlapiSearchRecord('item', null, filters, columns);
					if(result != null){
						var flag = result[0].getValue('custitem_unavailable_for_canada');
						if (flag == 'T'){
							alert('WARNING: There are ITEMS in this Sales Order that are not allowed to ship to Canada');
							return false;
						}
					}
				}
			}
		}
	}
	return true;
}

function onSave(){
	var shipCountry = nlapiGetFieldValue('shipcountry');
	if(shipCountry == 'CA'){
		var lines = nlapiGetLineItemCount('item');
		if (lines>0){		
			for ( i = 1 ; i<= lines ; i++ ){
				var itemId = nlapiGetLineItemValue( 'item' , 'item' , i )
				var itemType = nlapiGetLineItemValue( 'item' , 'itemtype' , i )
				if(itemId!=null && itemId!=''){
					var filters = new Array();
					filters[0] = new nlobjSearchFilter('type', null, 'anyof', itemType);
					filters[0] = new nlobjSearchFilter('internalid', null, 'is', itemId);
					var columns = new Array();
					columns[0] = new nlobjSearchColumn('custitem_unavailable_for_canada');
					var result = nlapiSearchRecord('item', null, filters, columns);
					if(result != null){
						var flag = result[0].getValue('custitem_unavailable_for_canada');
						if (flag == 'T'){
							alert('There are ITEMS in this Sales Order that are not allowed to ship to Canada. Please change the destination or choose another Item.');
							return false;
						}
					}
				}
			}
		}
	}
	return true;
}

