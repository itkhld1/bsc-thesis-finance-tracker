[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/itkhld1/bsc-thesis-finance-tracker)

# Aura Finance - AI-Powered Personal Finance Management

Aura Finance is a comprehensive personal finance management system that leverages Artificial Intelligence to provide users with intelligent spending insights, automated expense tracking, and predictive budgeting.

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-ML-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/XGBoost-MultiOutput-EE4C2C?logo=xgboost&logoColor=white" />
  <img src="https://img.shields.io/badge/TensorFlow.js-LSTM-FF6F00?logo=tensorflow&logoColor=white" />
</p>


## 📷 Screenshots

<p float="left" align="center">
  <img width="430" src="ScreenShots/sc1.png">
  <img width="430" src="ScreenShots/sc2.png">
  <img width="430" src="ScreenShots/sc3.png">
  <img width="430" src="ScreenShots/sc4.png">
  <img width="430" src="ScreenShots/sc5.png">
  <img width="430" src="ScreenShots/sc6.png">
  <img width="430" src="ScreenShots/sc7.png">
  <img width="430" src="ScreenShots/sc8.png">
  <img width="430" src="ScreenShots/sc9.png">
  <img width="430" src="ScreenShots/sc10.png">
</p>

## 🚀 Features

- **Intuitive Dashboard**: Real-time overview of your financial health with interactive charts.
- **Smart Expense Tracking**:
  - **Manual Entry**: Quick and easy form for logging expenses.
  - **Receipt OCR**: Automatic extraction of amount and category from receipt images using Tesseract.js.
  - **Voice Input**: Natural language processing to log expenses via voice commands.
- **AI-Powered Insights**:
  - **Budget Optimization**: Multi-output XGBoost model (Python) to suggest ideal budget allocations based on income.
  - **Budget Forecasting**: LSTM-based predictions for future spending patterns using TensorFlow.js (Node.js).
  - **Spending Trends**: Visual analytics to identify habits and optimize savings.
- **Multi-Language Support**: Full support for English and Turkish (i18n).
- **Group Management**: Shared expense tracking and split-wise capabilities for groups.
- **Modern UI/UX**: Built with React, Tailwind CSS, and shadcn/ui for a seamless, responsive experience.

## 📂 Project Structure

```text
├── aura-finance-ai/        # Python-based ML models (XGBoost)
├── aura-finance-backend/     # Node.js/Express server & LSTM models
├── src/                    # React frontend source code
├── public/                 # Static assets
├── ScreenShots/            # Application screenshots
├── Thesis Reports/         # Thesis documentation, PDFs, and LaTeX files
└── seed_expenses.cjs       # Database seeding script
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Internationalization**: i18next
- **Charts**: Recharts
- **OCR**: Tesseract.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL
- **AI/ML**: TensorFlow.js (LSTM/RNN models for time-series forecasting)
- **Authentication**: JWT & Bcrypt.js

### AI Service (Python)
- **Framework**: Scikit-learn, XGBoost
- **Task**: Budget allocation optimization based on income datasets.
- **Communication**: Integrated via child process execution from the Node.js backend.

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python 3.x](https://www.python.org/) (for budget optimization models)
- [PostgreSQL](https://www.postgresql.org/) database

### 1. Clone the Repository
```bash
git clone https://github.com/itkhld1/bsc-thesis-finance-tracker.git
cd bsc-thesis-finance-tracker
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd aura-finance-backend
npm install
```

Create a `.env` file in the `aura-finance-backend` directory:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/aura_finance
JWT_SECRET=your_super_secret_key
```

### 3. AI Service Setup (Optional)
Install Python dependencies for the budget optimizer:
```bash
cd ../aura-finance-ai
pip install -r requirements.txt
```

### 4. Frontend Setup
Navigate back to the root directory and install dependencies:
```bash
cd ..
npm install
```

## 🚀 Usage

### Running the Application
To start the project, you need to run both the backend and the frontend.

**Start the Backend:**
```bash
cd aura-finance-backend
npm run dev
```

**Start the Frontend:**
```bash
# In the root directory
npm run dev
```

### Seeding Data
To populate the database with mock expenses for testing:
```bash
# Make sure the backend is running and the TOKEN in seed_expenses.cjs is valid
node seed_expenses.cjs
```

## 📄 Thesis & Documentation

This project is the core component of a Bachelor's Thesis. Comprehensive documentation is available in the `Thesis Reports/` directory, including:
- **Thesis.pdf**: The full thesis report.
- **Poster.pdf**: A visual summary of the project.
- **LaTeX Source**: Original source files for the report.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
