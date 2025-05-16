from flask import jsonify

def success_response(data=None, message=None, status_code=200):
    """Create a standardized success response"""
    response = {
        "success": True
    }
    
    if message:
        response["message"] = message
        
    if data:
        response.update(data)
    
    return jsonify(response), status_code

def error_response(error_message, error_code=None, status_code=400):
    """Create a standardized error response"""
    response = {
        "success": False,
        "error": error_message
    }
    
    if error_code:
        response["code"] = error_code
    
    return jsonify(response), status_code
