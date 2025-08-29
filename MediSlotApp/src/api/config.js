import { Platform } from 'react-native';

/*export const getApiBaseUrl = () => {
  // Change this to your LAN IP when testing on a real device
  //const LAN = 'http://YOUR_LAN_IP:5000'; 
  const LAN = 'http://192.168.8.156:5000'; 

  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  if (Platform.OS === 'ios')     return 'http://localhost:5000';
  return LAN; // web or fallback
};
*/

export const getApiBaseUrl = () => 'http://192.168.8.140:5000'; // your laptop's LAN IP
//192.168.8.140