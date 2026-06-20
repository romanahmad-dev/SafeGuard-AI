import { Operative, CameraFeed, AlertEvent, NotificationRule } from './types';

export const USER_REYES: Operative = {
  id: 'OR-04',
  name: 'Officer Reyes',
  email: 'reyes.cmd@safeguard.ai',
  accessLevel: 'Shift Supervisor',
  station: 'CENTER_04_A',
  lastSignIn: '01:04:12 UTC',
  status: 'ACTIVE'
};

export const MOCK_OPERATIVES: Operative[] = [
  {
    id: 'AJ-12',
    name: 'Jenkins, Arthur',
    email: 'jenkins.a@safeguard.ai',
    accessLevel: 'LEVEL 4 CLEARANCE',
    station: 'CENTER_04_A',
    lastSignIn: '04:12:00 UTC',
    status: 'ACTIVE'
  },
  {
    id: 'SM-55',
    name: 'Moretti, Sarah',
    email: 'moretti.s@safeguard.ai',
    accessLevel: 'LEVEL 2 CLEARANCE',
    station: 'WEST_GRID_B',
    lastSignIn: '12:45:10 UTC',
    status: 'OFFLINE'
  },
  {
    id: 'OR-04',
    name: 'Reyes, Carlos',
    email: 'reyes.cmd@safeguard.ai',
    accessLevel: 'Shift Supervisor',
    station: 'CENTER_04_A',
    lastSignIn: '01:04:12 UTC',
    status: 'ACTIVE'
  }
];

export const MOCK_NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'nr-1',
    severity: 'critical',
    title: 'Critical Failures',
    description: 'SMS + Voice Call (All Officers)'
  },
  {
    id: 'nr-2',
    severity: 'warning',
    title: 'Warning Thresholds',
    description: 'System Push + Email'
  },
  {
    id: 'nr-3',
    severity: 'info',
    title: 'Log Diagnostics',
    description: 'Silent Log Entry Only'
  }
];

export const MOCK_CAMERA_FEEDS: CameraFeed[] = [
  {
    id: 'CAM_01_DOCK_N',
    name: 'CAM_01_DOCK_N',
    live: true,
    statusText: 'LIVE',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvIyyxOVezZIyEOqKu5I2uD654nfDjbzc-cPbDiSvQZk-fzaFV6tvh5FNS2jixuWrMbF3xIJtDFazpnTPuDuPH-xmQAyCRo7I8b2peBiDI9RxSv8NChwdwusHcd9epHEBGAuLLEHYGWFqTFcU8iqepddtaaZPhXOJEYp4RF2ecAPepPV1arvcO-AVeb65g2DJWFHvLBNfhLT4bkji4upgAhtP7JM7EYEjf6OMZejN3KwuRxJCTkiUwRICgoaxKoo3Ktk2WxlROSME',
    detectionLabel: 'Personnel: ID-882',
    detectionStatus: 'SAFE_ZONE',
    overlayStyle: {
      top: '20%',
      left: '30%',
      width: '128px',
      height: '192px',
      type: 'safe'
    }
  },
  {
    id: 'CAM_02_MACH_S',
    name: 'CAM_02_MACH_S',
    live: true,
    statusText: 'LIVE',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_HqdUWia4QuIFG0iln5gBDjSrC-gLZcsLoiM9k_aqeUcKkJhtShHKZ0N-Y9D7ZicnS9KjNysd51Q4Id31pFDIteiIwhPZTu-Bkn8oF7lBrlK-uaTXrvKM3yX0tkYuxJyjVpJzHMiFcDfmnZ9dVWoxGdFUPpzIABXtv4dvsyN92jkf-7sd-rVfndWICw6XBpF7UEE236sXrZ4p4hH0HYhO6ICH9yN4sDYOM8eEkrQ35gGUvlta1I10VcXKlvr_LYXfo8zFcn9eO64',
    detectionLabel: 'Heat: 114°C',
    detectionStatus: 'THRESHOLD_EXCEEDED',
    overlayStyle: {
      top: '40%',
      left: '50%',
      width: '160px',
      height: '160px',
      type: 'warning'
    }
  },
  {
    id: 'CAM_03_CHEM_W',
    name: 'CAM_03_CHEM_W',
    live: true,
    statusText: 'ALERT',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyaHfBVDYbHKy0HJpjY6sNFFNzkyxikyt-9MauyzC1B6qvE1fi1a9G2dgg1a5i3wf90OnktIXmybcsbU6WT72pB6SQMDGqELaVxNpvjGoWHE0HHIW1PUV9vqdB0s8sMjoeXapVeSjhu7wZmKsFNX6jVQCiuOu5bzLEoBtAo9BBy4TtHsS10KAfXXxEKFhXJneMJ3A8GTA-s1tNWoavZQkXZCiQSZPaNLi1GZVbI0GlC1Cm4Yqie8ptQRJPW8aSJNkm01eYxqRkscU',
    detectionLabel: 'FIRE DETECTED - 98.2% CONF.',
    detectionStatus: 'EVACUATE_SECTOR_G',
    overlayStyle: {
      top: '30%',
      left: '20%',
      width: '224px',
      height: '160px',
      type: 'danger'
    }
  },
  {
    id: 'CAM_04_CORR_E',
    name: 'CAM_04_CORR_E',
    live: true,
    statusText: 'LIVE',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtjSbkleZdAfcesrgBm74qP7mAqPn8-IQq0rn7AkeGhPFqiN3lumwusb8kY9nYI3k82B7sZiu6na2yBdNfrIiPmIvVhsbRFj-bQGLoi7bYZRD-h7LKqHbWHowSRvnVBIskAZkvZVBWOXLVHlCqeX361q8TwKHASVtN1IuJS5B5D79XxhRPK_DAiwuDmPaYU5EzOpjcidQrmIfGDg3OhC76vOSA1er0r0xA0RupvjzGF5bv1EFL09YxLqxF7Pnh5PijBjhvy7y7Ooc',
    detectionLabel: 'PPE VIOLATION',
    detectionStatus: 'HELMET_MISSING',
    overlayStyle: {
      top: '25%',
      left: '60%',
      width: '96px',
      height: '128px',
      type: 'warning'
    }
  }
];

export const MOCK_ALERTS: AlertEvent[] = [
  {
    id: 'alert-1',
    title: 'Critical: High Pressure Gas Leak',
    message: 'Automatic valve suppression failed. Manual intervention required at Junction 12.',
    severity: 'critical',
    timestamp: '14:22:05 | SEC-G-P4',
    location: 'Sector G, Pipe Junction 12',
    confidence: 99.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPRCA2qLrvE5wwFerp8TNCFAEg6_syhM1EYzS3H9h_b5ogwARXGVf7pH6xpYeKvMAbX_zbctzA0LQpPzAOGyU0eluYNoCk6-naA43F2IQihAaeTFfPL2XCzndxyRh5kbfgnBaXXiO5nYTo6iOUspjo7fGoQWsoiK3WWxlOVIU2NVVF25X1Zpvyusux86Ua0WQ8H3CUmbpo9IPLb2oPieyzZGtkhMPajS6CalVWX7q7RJWIBoGUiI2drZgKuIS6FmpAubtPHPo2LHA',
    imageThumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpRS3ZQvkBZZPR4_WjrPBkWxbVXEkrzkBWvEv-XIJ37w5LOaAVTM82CvZTxHjdfmc7FT5-z74EHvHRWNSM4gCtIJw9Bt6oc7gx7zmkuoeuQPAKxQ9H6l7HIhDQjKJwneUcGFTZy-fbUcqu94Ex1wPSGES4tXKeSxcowxyQ9j84UZK2PBCmSprA80m6sJs3GEaAzCiIphpNWaWvj3T3vBw5oyObiHJ-Ax9s0BHzvcTKu2M3ValdJBnPYTzaEfrZLNTRXn0SJ61HgpU',
    recommendation: [
      'Immediate evacuation of Sector G required.',
      'Deploy robotic shut-off Unit R4 code.',
      'Initiate ventilation protocol V-102.'
    ],
    status: 'ACTIVE'
  },
  {
    id: 'alert-2',
    title: 'Warning: Unauthorized Access',
    message: 'Personnel detected in Restricted Zone 4 without valid RFID beacon signature.',
    severity: 'warning',
    timestamp: '14:18:32 | SEC-G-ENTRY',
    location: 'Sector G Entry Corridor',
    confidence: 87.2,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXEV1m0pOOyJrhXRB_ehGj12V8ebp0DK7k1qkRAqkafAefce9kSO6ejJmxdYVCpbsc2bEvGSzVMVX9zOjcvOfqZbWQxLsLdazo8NzuMGc_lIFIWE6fJx_ER1Vohnq7qwVvIN24Qydd7N8z6IqyO86nDBjSIKeX2T5ErOnp9OJzNjvPQ3YSBcY6CSnwgjrOHD2rdF-C69NGakv4u4FwQlpYEb7f8YlSsaMtK5Gwfg7j6mrFU48HHiVW_1-MhDTFwn7nK-TTmn2O6eE',
    imageThumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXEV1m0pOOyJrhXRB_ehGj12V8ebp0DK7k1qkRAqkafAefce9kSO6ejJmxdYVCpbsc2bEvGSzVMVX9zOjcvOfqZbWQxLsLdazo8NzuMGc_lIFIWE6fJx_ER1Vohnq7qwVvIN24Qydd7N8z6IqyO86nDBjSIKeX2T5ErOnp9OJzNjvPQ3YSBcY6CSnwgjrOHD2rdF-C69NGakv4u4FwQlpYEb7f8YlSsaMtK5Gwfg7j6mrFU48HHiVW_1-MhDTFwn7nK-TTmn2O6eE',
    recommendation: [
      'Verify contractor shift roster schedule.',
      'Dispatch perimeter patrol robot if unacknowledged.',
      'Trigger localized high-frequency chime to orient staff.'
    ],
    status: 'ACTIVE'
  },
  {
    id: 'alert-3',
    title: 'Info: Scheduled Maintenance',
    message: 'Technician J. Miller entered Unit 04 for routine sensor recalibration.',
    severity: 'info',
    timestamp: '14:05:11 | UNIT-04-A',
    location: 'Unit 04 - Sector G Assemblies',
    confidence: 100.0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeWXg2TT0i93IbbJ6ht848ryyLNo13WczDNCsY4t_SqM6UwSY5KTOrjkJFfCs5D7rNBoQD2nc0zJ09NeXiEbPaSmmNujSH8OCo8pdm7ZNANwB3SNVQ9QZuItx0Ii3rtzXxNOfT3JdPPhKFS-fuxIjsOnRoCqcBLPUX6ucIPttXuutKEChAHr9fpKCmnLf8rtEhtAEyRcNB6Lvv-Uomzuhn5XC-RaPgnahx8_vjUOtwwDGo4fVs3_NKuA1ruL4V000rg_ND--bFhj4',
    imageThumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeWXg2TT0i93IbbJ6ht848ryyLNo13WczDNCsY4t_SqM6UwSY5KTOrjkJFfCs5D7rNBoQD2nc0zJ09NeXiEbPaSmmNujSH8OCo8pdm7ZNANwB3SNVQ9QZuItx0Ii3rtzXxNOfT3JdPPhKFS-fuxIjsOnRoCqcBLPUX6ucIPttXuutKEChAHr9fpKCmnLf8rtEhtAEyRcNB6Lvv-Uomzuhn5XC-RaPgnahx8_vjUOtwwDGo4fVs3_NKuA1ruL4V000rg_ND--bFhj4',
    recommendation: [
      'Track operative positioning inside the hot chamber.',
      'Confirm auto-exclusion zone setup is active during operations.',
      'Automatic status recovery scheduled after 30 minutes.'
    ],
    status: 'ACTIVE'
  },
  {
    id: 'alert-4',
    title: 'Critical: Collision Risk Detected',
    message: 'Automated vehicle safety override engaged. Obstruction detected in Aisle 3 path.',
    severity: 'critical',
    timestamp: '13:58:22 | WH-B-AISLE3',
    location: 'Warehouse B Logistics Aisle 3',
    confidence: 94.5,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDH7z-xRVgTkiqoXE_AJd1eqyeu1t6_Uvv7wYaG42oTbXl7Zj8MY9OgS8VC_V2w3w_9v7WXP84FJ1RP5_ZDjrsMdiSOnrTjx8p5XGj2J4ZRjYu_w9fhpAAc2r6wF0hQYZ71NMN6QirPY2hm_rL57LSyrOG_lkVfH9Z9EVAwsybbuhTU51ph08nLBUdJFlX-v-geHkUG4v_8TIjAsUziQFZB1iKDUHuD48G_MhKNWE73wa0dx5a8v238YRtc2e3-QtAmjx97ZlIyZM',
    imageThumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDH7z-xRVgTkiqoXE_AJd1eqyeu1t6_Uvv7wYaG42oTbXl7Zj8MY9OgS8VC_V2w3w_9v7WXP84FJ1RP5_ZDjrsMdiSOnrTjx8p5XGj2J4ZRjYu_w9fhpAAc2r6wF0hQYZ71NMN6QirPY2hm_rL57LSyrOG_lkVfH9Z9EVAwsybbuhTU51ph08nLBUdJFlX-v-geHkUG4v_8TIjAsUziQFZB1iKDUHuD48G_MhKNWE73wa0dx5a8v238YRtc2e3-QtAmjx97ZlIyZM',
    recommendation: [
      'Instruct forklift operator Arthur to halt and dismount immediately.',
      'Initiate audible warning horns on loading portal G-4.',
      'Check tracking telemetry of automated forklift routing software.'
    ],
    status: 'ACTIVE'
  }
];
