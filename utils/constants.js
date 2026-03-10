exports.CONSTANTS = {
    MAX_JSON_SIZE: "20kb",
    EMAIL_VERIFICATION_EXPIRES: 10 * 60 * 1000, // 10 minutes
    PASSWORD_RESET_EXPIRES: 10 * 60 * 1000, // 10 minutes
    IMAGE_RESIZE: {
        PRODUCT_MAIN: { width: 500, height: 500, quality: 90 },
        PRODUCT_VARIANT: { width: 600, height: 350, quality: 90 },
        CATEGORY: { width: 500, height: 500, quality: 90 },
        USER: { width: 500, height: 500, quality: 90 },
    },
    ROLES: {
        SUPER_ADMIN: "super-admin",
        ADMIN: "admin",
        USER: "user",
    },
};
