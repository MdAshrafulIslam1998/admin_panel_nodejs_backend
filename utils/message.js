
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
    TRANSACTION_HISTORY_CATEGORIZED_FETCHED: 'Categorized transaction history fetched successfully',
    TRANSACTION_HISTORY_CATEGORIZED_FAILED: 'Failed to fetch categorized transaction history',
    TRANSACTION_HISTORY_PAGINATED_FETCHED: 'Paginated transaction history fetched successfully',
    TRANSACTION_HISTORY_PAGINATED_FAILED: 'Failed to fetch paginated transaction history',

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
