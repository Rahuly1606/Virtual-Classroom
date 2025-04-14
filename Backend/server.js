import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Import routes
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';

// Load environment variables
dotenv.config();

// Swagger documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Virtual Classroom API',
      version: '1.0.0',
      description: 'API documentation for Virtual Classroom System',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);

// Swagger docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root route
app.get('/', (req, res) => {
  res.send('Virtual Classroom API is running');
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server after successful database connection
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app; 