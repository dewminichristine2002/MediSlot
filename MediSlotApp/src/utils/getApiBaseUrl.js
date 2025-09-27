

  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  if (Platform.OS === 'ios')     return 'http://localhost:5000';
  return LAN; // web or fallback
};
*/

export const getApiBaseUrl = () => 'http://10.118.200.210:5000'; // your laptop's LAN IP
//192.168.8.140
//192.168.8.140--home
