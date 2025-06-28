import { sequelize } from './db';
import User from '../models/User';
import Post from '../models/Post';
import Like from '../models/Like';
import Counselor from '../models/Counselor';

export const syncDatabase = async () => {
  try {
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
    
    // Create some sample data if tables are empty
    // await createSampleData();
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

const createSampleData = async () => {
  try {
    // Check if users exist
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Creating sample users...');
      
      const users = await User.bulkCreate([
        {
          name: 'Uzumaki Naruto',
          email: 'naruto@konoha.com',
          password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZATYEKV/7kVgEgQTwdXKq', // secret123
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          role: 'Counsellor',
        },
        {
          name: 'Sakura Haruno',
          email: 'sakura@konoha.com',
          password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZATYEKV/7kVgEgQTwdXKq', // secret123
          avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
          role: 'Counsellor',
        },
        {
          name: 'Kakashi Hatake',
          email: 'kakashi@konoha.com',
          password: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZATYEKV/7kVgEgQTwdXKq', // secret123
          avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
          role: 'Counsellor',
        },
      ]);

      console.log('Sample users created');

      // Create counselor profiles for users with 'Counsellor' role
      console.log('Creating counselor profiles...');
      
      for (const user of users) {
        if (user.get('role') === 'Counsellor') {
          await Counselor.create({
            userId: user.id,
            title: user.id === 1 ? 'Licensed Clinical Psychologist' : 
                   user.id === 2 ? 'Mental Health Therapist' : 'Cognitive Behavioral Therapist',
            specialties: user.id === 1 ? ['Anxiety', 'Depression', 'Trauma'] :
                         user.id === 2 ? ['Stress Management', 'Relationship Counseling'] :
                         ['PTSD', 'Grief Counseling', 'Mindfulness'],
            bio: `Professional with extensive experience helping people overcome their mental health challenges. 
                 Specialized in providing support and guidance for various psychological issues.`,
            rating: 4.8 + (Math.random() * 0.4 - 0.2) // Random rating between 4.6 and 5.0
          });
        }
      }
      
      console.log('Counselor profiles created');

      // Create sample posts
      console.log('Creating sample posts...');
      
      const posts = await Post.bulkCreate([
        {
          userId: users[0].id, // Naruto
          content: `Today i visited my favourite ramen shop which is "Ichiraku Ramen" Like always i forgot to bought money 😅😅

Old man Teuchi just laughed and said, "You again?" Luckily, he let me eat on credit—again 😅. I got my usual miso pork with extra toppings, and man, it hit the spot! 😋

Even when life gets rough or training wears me down, Ichiraku always feels like home. It's not just about the food—it's about that warmth, that small moment of peace.

Sometimes, little comforts like this help me keep going. 😊✨`,
          hashtags: ['#RamenTherapy', '#SmallJoys', '#BelieveIt'],
          views: 2345,
          likes: 1678,
          comments: 102,
          backgroundColor: '#FFE4E6',
        },
        {
          userId: users[1].id, // Sakura
          content: `Just finished my medical training session with Lady Tsunade! 💪 Learned some amazing new healing techniques today. 

The human body is so complex, but understanding it helps me become a better medic ninja. Can't wait to put these skills to use! 

PS: Naruto, if you're reading this - please stop getting injured so much! 😤`,
          hashtags: ['#MedicNinja', '#Training', '#HealingHands'],
          views: 1890,
          likes: 1243,
          comments: 87,
          backgroundColor: '#E0F2FE',
        },
        {
          userId: users[2].id, // Kakashi
          content: `Found a new spot to read my book today. Perfect shade, quiet, and no distractions. 

Though I might have to find a new place tomorrow... Naruto has a knack for finding me when I least expect it. 

*flips page*`,
          hashtags: ['#Reading', '#PeaceAndQuiet', '#MakeOutTactics'],
          views: 3210,
          likes: 2456,
          comments: 156,
          backgroundColor: '#ECFDF5',
        },
      ]);

      console.log('Sample posts created');

      // Create some sample likes
      console.log('Creating sample likes...');
      await Like.bulkCreate([
        { userId: users[1].id, postId: posts[0].id }, // Sakura likes Naruto's post
        { userId: users[2].id, postId: posts[0].id }, // Kakashi likes Naruto's post
        { userId: users[0].id, postId: posts[1].id }, // Naruto likes Sakura's post
        { userId: users[2].id, postId: posts[1].id }, // Kakashi likes Sakura's post
        { userId: users[0].id, postId: posts[2].id }, // Naruto likes Kakashi's post
        { userId: users[1].id, postId: posts[2].id }, // Sakura likes Kakashi's post
      ]);

      console.log('Sample likes created');
    }
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};