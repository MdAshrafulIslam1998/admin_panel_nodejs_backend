
module.exports = {
  MESSAGES: {
    VALIDATION_ERROR: 'Validation error',
    INVALID_CREDENTIALS: 'Please provide a valid credential',
    USERNAME_TAKEN: 'Username is already taken',
    ERROR: 'Error : ',
    PROVIDE_VALID_CREDENTIAL: 'Please provide a valid credential',
    BAD_REQUEST : 'Bad Requst',
    SERVER_ERROR : 'Server Error',
    USER_NOT_FOUND : 'User not found',
    USER_SUCCESS_DETAILS : 'User details found successfully',
    USER_LIST_FETCH_SUCCESSFULLY: 'User list fetched successfully',
    NO_USERS_FOUND: 'No users found',
    PROFILE_FETCH_SUCCESS: "User profile fetched successfully",
    LEVEL_ADDED_SUCCESSFULLY: "Level added successfully",
    INVALID_INPUT: "Level name and level value are required",
    LEVEL_UPDATE_SUCCESS: "User level updated successfully",
    LEVEL_REQUIRED: "Level is required.",
    UPDATE_SUCCESS: "User level updated successfully.",
    STATUS_UPDATE_SUCCESS: "User status updated successfully.",
    LEVELS_FETCH_SUCCESSFULLY: 'Levels fetched successfully',
    NO_LEVELS_FOUND: 'No levels found',
    LEVEL_NOT_FOUND: 'Level not found',
    LEVEL_DELETED_SUCCESSFULLY: 'Level deleted successfully',
    LEVEL_HAS_ASSOCIATED_USERS: 'Level cannot be deleted because users are associated with it',
    LEVEL_UPDATED_SUCCESSFULLY: 'Level and associated users updated successfully',
    USER_COIN_LIST_FETCHED: 'User list with coin data fetched successfully.',
    DOCUMENT_ADDED_SUCCESSFULLY: 'Document added successfully',
    USER_SUCCESS_DETAILS: 'User details found successfully',
    USER_LEVEL_UPDATED_SUCCESSFULLY: "User level updated successfully.",
    USER_LEVEL_UPDATE_FAILED: "Failed to update user level.",
    INVALID_STATUS: "Invalid status value provided.",
    MISSING_REQUIRED_FIELDS: "Required fields are missing.",
    NOTIFICATION_CREATED_SUCCESSFULLY: 'Notification created successfully',
    NO_DATA_FOUND: 'No data found',
    NOT_FOUND: 'Not found',
    TOKEN_GENERATE_SUCCESS : 'Token genereted successfully',
    TOKEN_GENERATE_FAILED: 'Failed to generate Token',
    STATUS_UPDATED_SUCCESS: 'Status updated successfully',
    STATUS_NOT_INITIATED: 'Status is not INITIATED',


    EMAIL_PASSWORD_REQUIRED: 'Email and password are required.',
    USER_NOT_VERIFIED: 'User is not verified. Please complete verification.',
    LOGIN_SUCCESS: 'Login successful.',
    USER_NOT_VERIFIED: 'User is not verified. Please complete verification.',
    USER_NOT_ELIGIBLE: 'User is not eligible to log in. Please contact support.',

    NAME_EMAIL_PASSWORD_REQUIRED: 'Name, email, and password are required.',
    EMAIL_ALREADY_EXISTS: 'Email already exists.',
    SUCCESS: 'Success',
    REGISTRATION_SUCCESS: 'Registration successful.',
  

    // Coin-related
    USER_LIST_FETCHED: 'User list fetched successfully',
    USER_LIST_FETCH_FAILED: 'Failed to fetch user list',
    COIN_UPDATE_SUCCESS: 'Coin value updated successfully',
    COIN_UPDATE_FAILED: 'Failed to update coin value',
    COIN_UPDATE_NO_RECORDS: 'No matching records found to update',
    COIN_UPDATE_VALIDATION_ERROR: 'Validation error: Missing required fields for coin update',

    // Transaction-related
    TRANSACTION_HISTORY_FETCHED: 'Transaction history fetched successfully',
    TRANSACTION_HISTORY_FAILED: 'Failed to fetch transaction history',
     // New messages for transaction history
     NO_TRANSACTIONS_FOUND: 'No transactions found',
     TRANSACTION_HISTORY_FETCH_SUCCESS: 'Transaction history fetched successfully',
     INVALID_CATEGORY_ID: 'Invalid or missing category ID',  // New message

     USER_PROFILE_FETCH_SUCCESS: 'User profile fetched successfully',
     
    
    // Category-related
    CATEGORY_ADDED_SUCCESS: 'Category added successfully',
    CATEGORY_ADD_FAILED: 'Failed to add category',
    CATEGORY_ADD_VALIDATION_ERROR: 'Validation error: Name and created_by are required',
    CATEGORY_UPDATE_SUCCESS: 'Category updated successfully',
    CATEGORY_UPDATE_FAILED: 'Failed to update category',
    CATEGORY_UPDATE_NOT_FOUND: 'Category not found',
    CATEGORY_DELETE_ASSOCIATED: 'Category cannot be deleted as it has associated transactions',
    CATEGORY_DELETE_NOT_FOUND: 'Category not found',
    CATEGORY_DELETED_SUCCESS: 'Category deleted successfully',
    CATEGORY_DELETE_FAILED: 'Failed to delete category',
    CATEGORY_LIST_FETCHED: 'Categories fetched successfully',
    CATEGORY_LIST_FAILED: 'Failed to fetch categories',

     // Document-related
     DOCUMENT_ADDED_SUCCESSFULLY: 'Document added successfully',
     DOCUMENT_ADD_FAILED: 'Failed to add the document',
     DOCUMENT_INVALID_INPUT: 'Invalid input: doc_type, uid, and path are required',

     ROLE_ADDED: 'Role added successfully',
    ROLES_FETCHED: 'Roles fetched successfully',
    ROLE_UPDATED: 'Role updated successfully',
    ROLE_DELETED: 'Role deleted successfully',
    ROLE_ASSOCIATED_WITH_STAFF: 'Cannot delete this role, it has associated staff',
    ROLE_NOT_FOUND: 'Role not found',

    STAFF_ADDED: 'Staff added successfully',
    STAFF_ROLE_UPDATED: 'Staff role updated successfully',
    STAFFS_FETCHED: 'Staff list fetched successfully',
    STAFF_NOT_FOUND: 'Staff not found',

    SLIDERS_NOT_FOUND: 'Sliders not found',
    SLIDERS_FETCHED: 'Sliders fetched successfully',

    
   
    PASSWORD_RESET_SUCCESS: 'Password reset successful.',

    NO_LEVELS_FOUND_FOR_USER: 'No levels found for the user',
    LEVELS_FETCHED_SUCCESSFULLY: 'Levels fetched successfully',
    

    TFA_CODE_SENT: 'Verification code sent successfully.',
    INVALID_TFA_CODE: 'Invalid verification code.',
    TFA_CODE_EXPIRED: 'The verification code has expired.',
    TFA_VALIDATED: 'Two-factor authentication validated successfully.',
    SESSION_NOT_FOUND: 'Session not found.',
    INVALID_INPUT_PROVIDED: 'Invalid input provided.',

    // Agora 
    INVALID_TOKEN_INPUT: 'Invalid input: channel name and UID are required',


  },
  RESPONSE_CODES: {
    SUCCESS: 'S100000',
    VALIDATION_ERROR: 'EV100001', // Database Propertis Validation
    UNAUTHORIZED: 'UN10001',
    FORBIDDEN: 'E00002',
    NOT_FOUND: 'E00003',
    BAD_REQUEST :'BAD404',
    SERVER_ERROR :'SV1000',
    LEVEL_HAS_ASSOCIATED_USERS: 'LAU409',
    MAXIMUM_LIMIT_REACHED :'TRX404'
    
  },

  ACCESS_STATUS : {
    APPROVED : 'APPROVED',
    DENIED : 'DENIED'
  }
};
