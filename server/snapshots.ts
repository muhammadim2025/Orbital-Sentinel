// Fallback and historical snapshots for Space Situational Awareness
// Includes May 8-14, 2024 severe solar storm data and standard TLE baselines

export const NOMINAL_DONKI = {
  FLR: [
    {
      flrID: "2026-09-28T14:15:00-FLR-001",
      beginTime: "2026-09-28T14:02Z",
      peakTime: "2026-09-28T14:15Z",
      endTime: "2026-09-28T14:28Z",
      classType: "C1.8",
      sourceLocation: "N14E32",
      activeRegionNum: 13840,
      note: "Quiescent background C1.8 solar flare from AR3840"
    },
    {
      flrID: "2026-09-27T08:40:00-FLR-001",
      beginTime: "2026-09-27T08:30Z",
      peakTime: "2026-09-27T08:40Z",
      endTime: "2026-09-27T08:52Z",
      classType: "C2.4",
      sourceLocation: "S20W15",
      activeRegionNum: 13838,
      note: "Minor C-class flare, no Earth-directed component"
    }
  ],
  CME: [
    {
      activityID: "2026-09-27T10:00:00-CME-001",
      startTime: "2026-09-27T10:00Z",
      sourceLocation: "N14E45",
      note: "Slow solar limb CME, deflected from Sun-Earth line",
      cmeAnalyses: [
        {
          time21_5: "2026-09-27T12:00Z",
          latitude: 12.0,
          longitude: 48.0,
          halfAngle: 32.0,
          speed: 420.0,
          type: "S",
          isMostAccurate: true,
          enlilList: [
            {
              modelCompletionTime: "2026-09-27T15:00Z",
              estimatedShockArrivalTime: "No Earth impact (flank sweep)",
              estimatedDuration: 12.0,
              impactList: [{ isGlancing: true, location: "Earth" }]
            }
          ]
        }
      ]
    }
  ],
  GST: [
    {
      gstID: "2026-09-26T12:00:00-GST-001",
      startTime: "2026-09-26T12:00Z",
      allKpIndex: [
        { observedTime: "2026-09-26T12:00Z", kpIndex: 2.33, source: "NOAA" },
        { observedTime: "2026-09-26T15:00Z", kpIndex: 2.67, source: "NOAA" },
        { observedTime: "2026-09-26T18:00Z", kpIndex: 3.00, source: "NOAA" }
      ],
      note: "Quiescent geomagnetic field conditions with minor solar wind variability."
    }
  ]
};

export const MAY_2024_STORM_DONKI = {
  FLR: [
    {
      flrID: "2024-05-08T05:09:00-FLR-001",
      beginTime: "2024-05-08T05:04Z",
      peakTime: "2024-05-08T05:09Z",
      endTime: "2024-05-08T05:15Z",
      classType: "X1.0",
      sourceLocation: "S18W20",
      activeRegionNum: 13664,
      note: "Major X1.0 flare from hyperactive AR3664"
    },
    {
      flrID: "2024-05-10T06:54:00-FLR-001",
      beginTime: "2024-05-10T06:27Z",
      peakTime: "2024-05-10T06:54Z",
      endTime: "2024-05-10T07:06Z",
      classType: "X3.9",
      sourceLocation: "S18W40",
      activeRegionNum: 13664,
      note: "Extreme X3.9 solar flare producing Earth-directed CME"
    },
    {
      flrID: "2024-05-11T01:23:00-FLR-001",
      beginTime: "2024-05-11T01:10Z",
      peakTime: "2024-05-11T01:23Z",
      endTime: "2024-05-11T01:35Z",
      classType: "X5.8",
      sourceLocation: "S17W51",
      activeRegionNum: 13664,
      note: "Monster X5.8 flare driving intense ionization and thermospheric heating"
    },
    {
      flrID: "2024-05-14T16:51:00-FLR-001",
      beginTime: "2024-05-14T16:40Z",
      peakTime: "2024-05-14T16:51Z",
      endTime: "2024-05-14T17:02Z",
      classType: "X8.7",
      sourceLocation: "S18W89",
      activeRegionNum: 13664,
      note: "Strongest flare of Solar Cycle 25 (X8.7)"
    }
  ],
  CME: [
    {
      activityID: "2024-05-08T06:12:00-CME-001",
      startTime: "2024-05-08T06:12Z",
      sourceLocation: "S18W20",
      note: "Fast halo CME associated with X1.0 flare",
      cmeAnalyses: [
        {
          time21_5: "2024-05-08T08:30Z",
          latitude: -16.0,
          longitude: -18.0,
          halfAngle: 68.0,
          speed: 1250.0,
          type: "C",
          isMostAccurate: true,
          enlilList: [
            {
              modelCompletionTime: "2024-05-08T14:00Z",
              estimatedShockArrivalTime: "2024-05-10T16:45Z",
              estimatedDuration: 36.0,
              impactList: [{ isGlancing: false, location: "Earth" }]
            }
          ]
        }
      ]
    },
    {
      activityID: "2024-05-09T09:48:00-CME-001",
      startTime: "2024-05-09T09:48Z",
      sourceLocation: "S17W35",
      note: "Severe full halo CME cannibalizing earlier plasma fronts",
      cmeAnalyses: [
        {
          time21_5: "2024-05-09T11:45Z",
          latitude: -15.0,
          longitude: -30.0,
          halfAngle: 75.0,
          speed: 1680.0,
          type: "O",
          isMostAccurate: true,
          enlilList: [
            {
              modelCompletionTime: "2024-05-09T16:00Z",
              estimatedShockArrivalTime: "2024-05-10T21:30Z",
              estimatedDuration: 48.0,
              impactList: [{ isGlancing: false, location: "Earth" }]
            }
          ]
        }
      ]
    }
  ],
  GST: [
    {
      gstID: "2024-05-10T21:00:00-GST-001",
      startTime: "2024-05-10T17:00Z",
      allKpIndex: [
        { observedTime: "2024-05-10T18:00Z", kpIndex: 8.33, source: "NOAA" },
        { observedTime: "2024-05-10T21:00Z", kpIndex: 9.00, source: "NOAA" },
        { observedTime: "2024-05-11T00:00Z", kpIndex: 9.00, source: "NOAA" },
        { observedTime: "2024-05-11T03:00Z", kpIndex: 8.67, source: "NOAA" },
        { observedTime: "2024-05-11T06:00Z", kpIndex: 8.00, source: "NOAA" }
      ],
      note: "Extreme G5 Geomagnetic Storm (Kp=9.0). Severe thermospheric expansion and satellite drag observed across all LEO orbits."
    }
  ]
};

export const FALLBACK_TLE_GROUPS: Record<string, any[]> = {
  stations: [
    {
      OBJECT_NAME: "ISS (ZARYA)",
      OBJECT_ID: "1998-067A",
      EPOCH: "2026-09-28T18:22:10.000000",
      MEAN_MOTION: 15.49814522,
      ECCENTRICITY: 0.0004921,
      INCLINATION: 51.6415,
      RA_OF_ASC_NODE: 182.4128,
      ARG_OF_PERICENTER: 94.3120,
      MEAN_ANOMALY: 265.8190,
      EPHEMERIS_TYPE: 0,
      CLASSIFICATION_TYPE: "U",
      NORAD_CAT_ID: 25544,
      ELEMENT_SET_NUMBER: 999,
      REV_AT_EPOCH: 48920,
      BSTAR: 0.0002148,
      MEAN_MOTION_DOT: 0.00003120,
      MEAN_MOTION_DDOT: 0.0
    },
    {
      OBJECT_NAME: "TIANGONG (CSS)",
      OBJECT_ID: "2021-035A",
      EPOCH: "2026-09-28T17:50:00.000000",
      MEAN_MOTION: 15.60214500,
      ECCENTRICITY: 0.0001850,
      INCLINATION: 41.4720,
      RA_OF_ASC_NODE: 220.1410,
      ARG_OF_PERICENTER: 110.2030,
      MEAN_ANOMALY: 249.9100,
      EPHEMERIS_TYPE: 0,
      CLASSIFICATION_TYPE: "U",
      NORAD_CAT_ID: 48274,
      ELEMENT_SET_NUMBER: 999,
      REV_AT_EPOCH: 19120,
      BSTAR: 0.0001820,
      MEAN_MOTION_DOT: 0.00002510,
      MEAN_MOTION_DDOT: 0.0
    }
  ],
  starlink: [
    {
      OBJECT_NAME: "STARLINK-1007",
      OBJECT_ID: "2019-074A",
      EPOCH: "2026-09-28T14:10:00.000000",
      MEAN_MOTION: 15.064120,
      ECCENTRICITY: 0.000142,
      INCLINATION: 53.054,
      RA_OF_ASC_NODE: 112.45,
      ARG_OF_PERICENTER: 65.20,
      MEAN_ANOMALY: 294.85,
      NORAD_CAT_ID: 44713,
      BSTAR: 0.000045,
      MEAN_MOTION_DOT: 0.000005
    },
    {
      OBJECT_NAME: "STARLINK-3112",
      OBJECT_ID: "2021-125B",
      EPOCH: "2026-09-28T15:20:00.000000",
      MEAN_MOTION: 15.063850,
      ECCENTRICITY: 0.000160,
      INCLINATION: 53.218,
      RA_OF_ASC_NODE: 198.71,
      ARG_OF_PERICENTER: 88.10,
      MEAN_ANOMALY: 271.95,
      NORAD_CAT_ID: 50124,
      BSTAR: 0.000052,
      MEAN_MOTION_DOT: 0.000006
    },
    {
      OBJECT_NAME: "STARLINK-5120",
      OBJECT_ID: "2022-085C",
      EPOCH: "2026-09-28T16:45:00.000000",
      MEAN_MOTION: 15.064010,
      ECCENTRICITY: 0.000155,
      INCLINATION: 53.220,
      RA_OF_ASC_NODE: 275.40,
      ARG_OF_PERICENTER: 104.50,
      MEAN_ANOMALY: 255.60,
      NORAD_CAT_ID: 53310,
      BSTAR: 0.000048,
      MEAN_MOTION_DOT: 0.000005
    },
    {
      OBJECT_NAME: "STARLINK-5341",
      OBJECT_ID: "2022-092A",
      EPOCH: "2026-09-28T16:00:00.000000",
      MEAN_MOTION: 15.064200,
      ECCENTRICITY: 0.000140,
      INCLINATION: 53.219,
      RA_OF_ASC_NODE: 35.12,
      ARG_OF_PERICENTER: 112.40,
      MEAN_ANOMALY: 247.60,
      NORAD_CAT_ID: 53520,
      BSTAR: 0.000044,
      MEAN_MOTION_DOT: 0.000005
    },
    {
      OBJECT_NAME: "STARLINK-5489",
      OBJECT_ID: "2022-111B",
      EPOCH: "2026-09-28T17:15:00.000000",
      MEAN_MOTION: 15.063980,
      ECCENTRICITY: 0.000148,
      INCLINATION: 53.218,
      RA_OF_ASC_NODE: 72.85,
      ARG_OF_PERICENTER: 95.10,
      MEAN_ANOMALY: 264.90,
      NORAD_CAT_ID: 53940,
      BSTAR: 0.000047,
      MEAN_MOTION_DOT: 0.000005
    },
    {
      OBJECT_NAME: "STARLINK-6014",
      OBJECT_ID: "2023-018A",
      EPOCH: "2026-09-28T18:00:00.000000",
      MEAN_MOTION: 15.064150,
      ECCENTRICITY: 0.000135,
      INCLINATION: 43.002,
      RA_OF_ASC_NODE: 144.30,
      ARG_OF_PERICENTER: 78.50,
      MEAN_ANOMALY: 281.40,
      NORAD_CAT_ID: 55620,
      BSTAR: 0.000042,
      MEAN_MOTION_DOT: 0.000004
    },
    {
      OBJECT_NAME: "STARLINK-6145",
      OBJECT_ID: "2023-042C",
      EPOCH: "2026-09-28T18:40:00.000000",
      MEAN_MOTION: 15.064090,
      ECCENTRICITY: 0.000142,
      INCLINATION: 43.001,
      RA_OF_ASC_NODE: 216.70,
      ARG_OF_PERICENTER: 89.20,
      MEAN_ANOMALY: 270.80,
      NORAD_CAT_ID: 56120,
      BSTAR: 0.000046,
      MEAN_MOTION_DOT: 0.000005
    },
    {
      OBJECT_NAME: "STARLINK-6380",
      OBJECT_ID: "2023-088A",
      EPOCH: "2026-09-28T19:10:00.000000",
      MEAN_MOTION: 15.064250,
      ECCENTRICITY: 0.000138,
      INCLINATION: 43.004,
      RA_OF_ASC_NODE: 288.90,
      ARG_OF_PERICENTER: 102.60,
      MEAN_ANOMALY: 257.40,
      NORAD_CAT_ID: 57240,
      BSTAR: 0.000045,
      MEAN_MOTION_DOT: 0.000005
    },
    {
      OBJECT_NAME: "STARLINK-7002",
      OBJECT_ID: "2023-145A",
      EPOCH: "2026-09-28T19:50:00.000000",
      MEAN_MOTION: 15.064180,
      ECCENTRICITY: 0.000145,
      INCLINATION: 53.220,
      RA_OF_ASC_NODE: 330.15,
      ARG_OF_PERICENTER: 75.30,
      MEAN_ANOMALY: 284.70,
      NORAD_CAT_ID: 58010,
      BSTAR: 0.000043,
      MEAN_MOTION_DOT: 0.000004
    },
    {
      OBJECT_NAME: "STARLINK-7150",
      OBJECT_ID: "2024-002B",
      EPOCH: "2026-09-28T20:20:00.000000",
      MEAN_MOTION: 15.064220,
      ECCENTRICITY: 0.000140,
      INCLINATION: 53.218,
      RA_OF_ASC_NODE: 54.60,
      ARG_OF_PERICENTER: 118.90,
      MEAN_ANOMALY: 241.10,
      NORAD_CAT_ID: 58650,
      BSTAR: 0.000045,
      MEAN_MOTION_DOT: 0.000005
    }
  ],
  "gps-ops": [
    {
      OBJECT_NAME: "NAVSTAR 62 (USA 203)",
      OBJECT_ID: "2009-014A",
      EPOCH: "2026-09-28T12:00:00.000000",
      MEAN_MOTION: 2.005680,
      ECCENTRICITY: 0.005120,
      INCLINATION: 55.45,
      RA_OF_ASC_NODE: 145.20,
      ARG_OF_PERICENTER: 35.80,
      MEAN_ANOMALY: 324.50,
      NORAD_CAT_ID: 34661,
      BSTAR: 0.000002,
      MEAN_MOTION_DOT: 0.0000001
    },
    {
      OBJECT_NAME: "NAVSTAR 73 (USA 266)",
      OBJECT_ID: "2016-007A",
      EPOCH: "2026-09-28T12:00:00.000000",
      MEAN_MOTION: 2.005720,
      ECCENTRICITY: 0.003980,
      INCLINATION: 55.12,
      RA_OF_ASC_NODE: 210.45,
      ARG_OF_PERICENTER: 48.90,
      MEAN_ANOMALY: 311.20,
      NORAD_CAT_ID: 41328,
      BSTAR: 0.000001,
      MEAN_MOTION_DOT: 0.0000001
    }
  ],
  weather: [
    {
      OBJECT_NAME: "NOAA 19",
      OBJECT_ID: "2009-005A",
      EPOCH: "2026-09-28T15:00:00.000000",
      MEAN_MOTION: 14.124580,
      ECCENTRICITY: 0.001420,
      INCLINATION: 98.71,
      RA_OF_ASC_NODE: 245.80,
      ARG_OF_PERICENTER: 85.10,
      MEAN_ANOMALY: 275.20,
      NORAD_CAT_ID: 33591,
      BSTAR: 0.000085,
      MEAN_MOTION_DOT: 0.000003
    },
    {
      OBJECT_NAME: "METOP-B",
      OBJECT_ID: "2012-049A",
      EPOCH: "2026-09-28T15:00:00.000000",
      MEAN_MOTION: 14.215200,
      ECCENTRICITY: 0.000190,
      INCLINATION: 98.72,
      RA_OF_ASC_NODE: 280.12,
      ARG_OF_PERICENTER: 98.40,
      MEAN_ANOMALY: 261.80,
      NORAD_CAT_ID: 38771,
      BSTAR: 0.000032,
      MEAN_MOTION_DOT: 0.000001
    }
  ],
  noaa: [
    {
      OBJECT_NAME: "NOAA 20 (JPSS-1)",
      OBJECT_ID: "2017-073A",
      EPOCH: "2026-09-28T16:00:00.000000",
      MEAN_MOTION: 14.195240,
      ECCENTRICITY: 0.000150,
      INCLINATION: 98.73,
      RA_OF_ASC_NODE: 310.20,
      ARG_OF_PERICENTER: 110.15,
      MEAN_ANOMALY: 250.00,
      NORAD_CAT_ID: 43013,
      BSTAR: 0.000028,
      MEAN_MOTION_DOT: 0.000002
    }
  ],
  goes: [
    {
      OBJECT_NAME: "GOES 16",
      OBJECT_ID: "2016-071A",
      EPOCH: "2026-09-28T12:00:00.000000",
      MEAN_MOTION: 1.002735,
      ECCENTRICITY: 0.000120,
      INCLINATION: 0.04,
      RA_OF_ASC_NODE: 75.20,
      ARG_OF_PERICENTER: 180.00,
      MEAN_ANOMALY: 180.00,
      NORAD_CAT_ID: 41866,
      BSTAR: 0.000000,
      MEAN_MOTION_DOT: 0.000000
    },
    {
      OBJECT_NAME: "GOES 18",
      OBJECT_ID: "2022-021A",
      EPOCH: "2026-09-28T12:00:00.000000",
      MEAN_MOTION: 1.002738,
      ECCENTRICITY: 0.000105,
      INCLINATION: 0.05,
      RA_OF_ASC_NODE: 137.10,
      ARG_OF_PERICENTER: 180.00,
      MEAN_ANOMALY: 180.00,
      NORAD_CAT_ID: 51850,
      BSTAR: 0.000000,
      MEAN_MOTION_DOT: 0.000000
    }
  ],
  "cosmos-2251-debris": [
    {
      OBJECT_NAME: "COSMOS 2251 DEB [33749]",
      OBJECT_ID: "1993-036KW",
      EPOCH: "2026-09-28T10:00:00.000000",
      MEAN_MOTION: 14.654210,
      ECCENTRICITY: 0.015240,
      INCLINATION: 74.02,
      RA_OF_ASC_NODE: 185.40,
      ARG_OF_PERICENTER: 120.30,
      MEAN_ANOMALY: 240.10,
      NORAD_CAT_ID: 33749,
      BSTAR: 0.000412,
      MEAN_MOTION_DOT: 0.000045
    },
    {
      OBJECT_NAME: "COSMOS 2251 DEB [33750]",
      OBJECT_ID: "1993-036KX",
      EPOCH: "2026-09-28T11:00:00.000000",
      MEAN_MOTION: 14.812400,
      ECCENTRICITY: 0.021050,
      INCLINATION: 74.04,
      RA_OF_ASC_NODE: 182.10,
      ARG_OF_PERICENTER: 135.20,
      MEAN_ANOMALY: 225.40,
      NORAD_CAT_ID: 33750,
      BSTAR: 0.000620,
      MEAN_MOTION_DOT: 0.000078
    },
    {
      OBJECT_NAME: "COSMOS 2251 DEB [33751]",
      OBJECT_ID: "1993-036KY",
      EPOCH: "2026-09-28T11:30:00.000000",
      MEAN_MOTION: 15.120500,
      ECCENTRICITY: 0.008450,
      INCLINATION: 74.01,
      RA_OF_ASC_NODE: 184.80,
      ARG_OF_PERICENTER: 95.10,
      MEAN_ANOMALY: 265.80,
      NORAD_CAT_ID: 33751,
      BSTAR: 0.000850,
      MEAN_MOTION_DOT: 0.000115
    }
  ],
  "iridium-33-debris": [
    {
      OBJECT_NAME: "IRIDIUM 33 DEB [33765]",
      OBJECT_ID: "1997-051CT",
      EPOCH: "2026-09-28T09:45:00.000000",
      MEAN_MOTION: 14.412800,
      ECCENTRICITY: 0.012400,
      INCLINATION: 86.41,
      RA_OF_ASC_NODE: 215.10,
      ARG_OF_PERICENTER: 145.80,
      MEAN_ANOMALY: 214.30,
      NORAD_CAT_ID: 33765,
      BSTAR: 0.000350,
      MEAN_MOTION_DOT: 0.000038
    },
    {
      OBJECT_NAME: "IRIDIUM 33 DEB [33766]",
      OBJECT_ID: "1997-051CU",
      EPOCH: "2026-09-28T10:15:00.000000",
      MEAN_MOTION: 14.754000,
      ECCENTRICITY: 0.018900,
      INCLINATION: 86.42,
      RA_OF_ASC_NODE: 213.80,
      ARG_OF_PERICENTER: 160.20,
      MEAN_ANOMALY: 199.70,
      NORAD_CAT_ID: 33766,
      BSTAR: 0.000510,
      MEAN_MOTION_DOT: 0.000062
    }
  ],
  active: [
    {
      OBJECT_NAME: "HST (HUBBLE)",
      OBJECT_ID: "1990-037B",
      EPOCH: "2026-09-28T14:30:00.000000",
      MEAN_MOTION: 15.092400,
      ECCENTRICITY: 0.000280,
      INCLINATION: 28.47,
      RA_OF_ASC_NODE: 92.15,
      ARG_OF_PERICENTER: 78.40,
      MEAN_ANOMALY: 281.90,
      NORAD_CAT_ID: 20580,
      BSTAR: 0.000042,
      MEAN_MOTION_DOT: 0.000004
    },
    {
      OBJECT_NAME: "TERRA (EOS AM-1)",
      OBJECT_ID: "1999-068A",
      EPOCH: "2026-09-28T15:10:00.000000",
      MEAN_MOTION: 14.571150,
      ECCENTRICITY: 0.000140,
      INCLINATION: 98.20,
      RA_OF_ASC_NODE: 180.40,
      ARG_OF_PERICENTER: 102.10,
      MEAN_ANOMALY: 258.00,
      NORAD_CAT_ID: 25994,
      BSTAR: 0.000025,
      MEAN_MOTION_DOT: 0.000002
    }
  ]
};

export const FALLBACK_SWPC: Record<string, any> = {
  scales: {
    "0": {
      R: { Text: "None", Val: "0" },
      S: { Text: "None", Val: "0" },
      G: { Text: "Minor", Val: "1" },
      DateStamp: "2026-09-28 20:00:00"
    }
  },
  kp: [
    ["time_tag", "Kp", "a_running", "station_count"],
    ["2026-09-28 15:00:00.000", "2.33", "7", "8"],
    ["2026-09-28 18:00:00.000", "2.67", "9", "8"],
    ["2026-09-28 21:00:00.000", "3.00", "12", "8"]
  ],
  "kp-forecast": [
    ["time_tag", "kp", "observed", "noaa_scale"],
    ["2026-09-29 00:00:00", "3.00", "predicted", "none"],
    ["2026-09-29 03:00:00", "2.67", "predicted", "none"],
    ["2026-09-29 06:00:00", "3.33", "predicted", "G1"]
  ],
  alerts: [
    {
      product_id: "ALTPK0",
      issue_datetime: "2026-09-28 18:45:00.000",
      message: "SPACE WEATHER MESSAGE: Planetary K-index of 3 observed. Geomagnetic field conditions: Quiet to Unsettled."
    }
  ],
  xray: [
    {
      time_tag: "2026-09-28T21:40:00Z",
      flux: 1.45e-6,
      energy: "0.1-0.8nm",
      flare_class: "C1.4"
    },
    {
      time_tag: "2026-09-28T21:50:00Z",
      flux: 1.82e-6,
      energy: "0.1-0.8nm",
      flare_class: "C1.8"
    }
  ],
  "wind-speed": {
    Speed: "418.5",
    Time: "2026-09-28 21:45:00"
  }
};

export const FALLBACK_EONET = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "EONET_10421",
      properties: {
        title: "Karymsky Volcano Ash Plume",
        categories: [{ id: "volcanoes", title: "Volcanoes" }],
        date: "2026-09-27T10:14:00Z",
        magnitudeValue: 12000,
        magnitudeUnit: "ft"
      },
      geometry: {
        type: "Point",
        coordinates: [159.442, 54.048]
      }
    },
    {
      type: "Feature",
      id: "EONET_10425",
      properties: {
        title: "Typhoon Pulasan Maritime Swell",
        categories: [{ id: "severeStorms", title: "Severe Storms" }],
        date: "2026-09-28T04:00:00Z",
        magnitudeValue: 45,
        magnitudeUnit: "kts"
      },
      geometry: {
        type: "Point",
        coordinates: [134.2, 28.5]
      }
    },
    {
      type: "Feature",
      id: "EONET_10430",
      properties: {
        title: "Pantanal Wetland Complex Fires",
        categories: [{ id: "wildfires", title: "Wildfires" }],
        date: "2026-09-28T12:00:00Z",
        magnitudeValue: null,
        magnitudeUnit: null
      },
      geometry: {
        type: "Point",
        coordinates: [-56.5, -17.8]
      }
    }
  ]
};

export const FALLBACK_NEO = {
  element_count: 5,
  near_earth_objects: {
    "2026-09-28": [
      {
        id: "54412984",
        name: "(2026 RF3)",
        absolute_magnitude_h: 24.6,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.032, estimated_diameter_max: 0.071 }
        },
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [
          {
            close_approach_date: "2026-09-28",
            close_approach_date_full: "2026-Sep-28 14:22",
            relative_velocity: { kilometers_per_second: "11.45" },
            miss_distance: { kilometers: "1284500", lunar: "3.34" }
          }
        ]
      },
      {
        id: "3542519",
        name: "(2010 PK9)",
        absolute_magnitude_h: 21.8,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.115, estimated_diameter_max: 0.258 }
        },
        is_potentially_hazardous_asteroid: true,
        close_approach_data: [
          {
            close_approach_date: "2026-09-28",
            close_approach_date_full: "2026-Sep-28 20:05",
            relative_velocity: { kilometers_per_second: "18.92" },
            miss_distance: { kilometers: "3940200", lunar: "10.25" }
          }
        ]
      }
    ]
  }
};

export const FALLBACK_LAUNCHES = {
  count: 3,
  results: [
    {
      id: "lnch-001",
      name: "Falcon 9 Block 5 | Starlink Group 10-14",
      status: { name: "Go for Launch" },
      net: "2026-09-29T18:30:00Z",
      window_start: "2026-09-29T18:00:00Z",
      pad: { name: "Space Launch Complex 40", location: { name: "Cape Canaveral SFS, FL, USA" } },
      mission: { description: "Deployment of 22 Starlink V2 Mini satellites into low Earth orbit." }
    },
    {
      id: "lnch-002",
      name: "Electron | " + "Ice Cloud Characterization",
      status: { name: "Go for Launch" },
      net: "2026-10-02T04:15:00Z",
      window_start: "2026-10-02T04:00:00Z",
      pad: { name: "Launch Complex 1B", location: { name: "Mahia Peninsula, New Zealand" } },
      mission: { description: "Dedicated mission for earth atmospheric observation payload." }
    }
  ]
};

export const FALLBACK_SPACEX = [
  {
    name: "Starlink 4-36 (v1.5)",
    date_utc: "2022-10-20T14:50:00.000Z",
    success: true,
    details: "Falcon 9 launched 54 Starlink satellites to low Earth orbit from SLC-40 at Cape Canaveral.",
    flight_number: 182
  },
  {
    name: "Starlink Group 6-1",
    date_utc: "2023-02-27T23:13:00.000Z",
    success: true,
    details: "First batch of 21 next-generation Starlink V2 Mini satellites launched to low Earth orbit.",
    flight_number: 206
  }
];
