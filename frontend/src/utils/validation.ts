export const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const isValidMobileNumber = (mobile: string): boolean => {
  if (!mobile) return false;
  return MOBILE_REGEX.test(mobile);
};
