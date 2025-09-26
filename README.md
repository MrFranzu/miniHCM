# 🕒 Mini HCM Time Tracking System

---

## 🚀 Features

- **User Registration & Authentication**
  - Firebase Authentication (Email/Password)
  - User details stored in Firestore (name, email, role, timezone, schedule)

- **Shift Scheduling**
  - Define shift start and end times per user
  - Used for computing lateness, undertime, and overtime

- **Time-In / Time-Out Logging**
  - React.js interface with Punch In / Punch Out buttons
  - Attendance records stored in Firestore with timestamps

- **Automatic Computations**
  - Regular hours (within scheduled shift)
  - Overtime (OT) beyond shift
  - Night Differential (ND) for work between 22:00–06:00
  - Late arrivals
  - Undertime (early leave)

- **Daily Summary**
  - Aggregated totals stored in Firestore
  - Dashboard + History table in React
  - Breakdown of Regular, OT, ND, Late, and Undertime

- **Admin Tools**
  - View and edit punches
  - Access daily and weekly reports with all metrics

---

## 🛠 Tech Stack

- **Frontend:** React.js  
- **Backend:** Node.js + Express  
- **Database & Auth:** Firebase (Firestore + Firebase Auth, free tier)  
- **Hosting:** Vercel 

---

## 📊 Expected Output

- ✅ Registration and login flow  
- ✅ Time-in / Time-out recording  
- ✅ Automatic computation of hours (Regular, OT, ND, Late, Undertime)  
- ✅ Daily summary dashboard with KPIs  
- ✅ Admin reporting tools  

---

## 📷 Screenshots 
<img width="1156" height="781" alt="image" src="https://github.com/user-attachments/assets/58f7a0e3-a33d-4349-af58-f6b7ab98db67" />

<img width="1178" height="601" alt="image" src="https://github.com/user-attachments/assets/72fce387-6e09-4be3-91bf-bcd3c14d90d3" />

<img width="1847" height="648" alt="image" src="https://github.com/user-attachments/assets/3bcafc5d-3fa2-4c5a-8450-6773343b1f12" />








