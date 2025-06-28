import { sequelize } from './db';
import User from '../models/User';
import Post from '../models/Post';
import Like from '../models/Like';
import Counselor from '../models/Counselor';
import Admin from '../models/Admin';
import Client from '../models/Client';
import Psychiatrist from '../models/Psychiatrist';
import MTMember from '../models/MT-member';
import Student from '../models/Student';
import Experience from '../models/Experience';
import EduQualification from '../models/EduQualification';

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
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          role: 'Counsellor',
        },
        {
          name: 'Sakura Haruno',
          email: 'sakura@konoha.com',
          avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
          role: 'Counsellor',
        },
        {
          name: 'Kakashi Hatake',
          email: 'kakashi@konoha.com',
          avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
          role: 'Counsellor',
        },
        {
          name: 'Tsunade Senju',
          email: 'tsunade@konoha.com',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
          role: 'Admin',
        },
        {
          name: 'Sasuke Uchiha',
          email: 'sasuke@cmb.ac.lk',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
          role: 'Client',
        },
        {
          name: 'Hinata Hyuga',
          email: 'hinata@mrt.ac.lk',
          avatar: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg',
          role: 'Client',
        },
        {
          name: 'Shikamaru Nara',
          email: 'shikamaru@gmail.com',
          avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
          role: 'Client',
        },
        {
          name: 'Orochimaru',
          email: 'orochimaru@konoha.com',
          avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
          role: 'Psychiatrist',
        },
        {
          name: 'Kabuto Yakushi',
          email: 'kabuto@konoha.com',
          avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
          role: 'Psychiatrist',
        },
        {
          name: 'Shizune',
          email: 'shizune@konoha.com',
          avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
          role: 'Psychiatrist',
        },
        {
          name: 'Jiraiya',
          email: 'jiraiya@konoha.com',
          avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
          role: 'MT-member',
        },
        {
          name: 'Might Guy',
          email: 'guy@konoha.com',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
          role: 'MT-member',
        },
        {
          name: 'Asuma Sarutobi',
          email: 'asuma@konoha.com',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
          role: 'MT-member',
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
            address: `${123 + user.id} Main Street, Colombo ${Math.floor(Math.random() * 15) + 1}`,
            contact_no: `+94 7${Math.floor(Math.random() * 10)} ${Math.floor(1000000 + Math.random() * 9000000)}`,
            licenseNo: user.id === 1 ? 'SLCP-' + (10000 + user.id) : 
                      user.id === 2 ? 'SLMHC-' + (20000 + user.id) : 
                      'SLCP-' + (30000 + user.id),
            idCard: user.id === 1 ? '/uploads/id_cards/counselor_naruto_id.pdf' :
                   user.id === 2 ? '/uploads/id_cards/counselor_sakura_id.jpg' :
                   '/uploads/id_cards/counselor_kakashi_id.png',
            isVolunteer: user.id === 3, // Only Kakashi is a volunteer
            isAvailable: user.id !== 3, // Kakashi is not available
            description: `Professional with extensive experience helping people overcome their mental health challenges. 
                 Specialized in providing support and guidance for various psychological issues.`,
            rating: 4.8 + (Math.random() * 0.4 - 0.2) // Random rating between 4.6 and 5.0
          });
        }
      }
      
      console.log('Counselor profiles created');

      // Create admin profiles for users with 'Admin' role
      console.log('Creating admin profiles...');
      
      for (const user of users) {
        if (user.get('role') === 'Admin') {
          await Admin.create({
            userId: user.id
          });
        }
      }
      
      console.log('Admin profiles created');
      
      // Create psychiatrist profiles for users with 'Psychiatrist' role
      console.log('Creating psychiatrist profiles...');
      
      for (const user of users) {
        if (user.get('role') === 'Psychiatrist') {
          await Psychiatrist.create({
            userId: user.id,
            specialization: user.id === 8 ? ['Clinical Psychiatry', 'Neuropsychiatry', 'Addiction Psychiatry'] :
                           user.id === 9 ? ['Child Psychiatry', 'Forensic Psychiatry'] :
                           ['Geriatric Psychiatry', 'Consultation Psychiatry', 'Emergency Psychiatry'],
            address: `${300 + user.id} Medical Complex, Colombo ${Math.floor(Math.random() * 15) + 1}`,
            contact_no: `+94 7${Math.floor(Math.random() * 10)} ${Math.floor(1000000 + Math.random() * 9000000)}`,
            licenseNo: user.id === 8 ? 'SLMC-PSY-' + (50000 + user.id) :
                      user.id === 9 ? 'SLMC-PSY-' + (60000 + user.id) :
                      'SLMC-PSY-' + (70000 + user.id),
            idCard: user.id === 8 ? '/uploads/id_cards/psychiatrist_orochimaru_id.pdf' :
                   user.id === 9 ? '/uploads/id_cards/psychiatrist_kabuto_id.jpg' :
                   '/uploads/id_cards/psychiatrist_shizune_id.png',
            isAvailable: user.id !== 8, // Orochimaru is not available
            description: `Board-certified psychiatrist with expertise in diagnosing and treating mental disorders. 
                 Specialized in medication management and comprehensive psychiatric care.`
          });
        }
      }
      
      console.log('Psychiatrist profiles created');
      
      // Create MT-member profiles for users with 'MT-member' role
      console.log('Creating MT-member profiles...');
      
      for (const user of users) {
        if (user.get('role') === 'MT-member') {
          await MTMember.create({
            userId: user.id,
            memberId: `MT${1000 + user.id}`,
            responsibility: user.id === 11 ? 'Crisis Intervention Specialist' :
                           user.id === 12 ? 'Wellness Program Coordinator' :
                           'Mental Health Educator'
          });
        }
      }
      
      console.log('MT-member profiles created');
      
      // Create client profiles for users with 'Client' role
      console.log('Creating client profiles...');
      
      for (const user of users) {
        if (user.get('role') === 'Client') {
          try {
            // Get email and determine university based on email domain
            const email = user.get('email');
            const domain = email.split('@')[1];
            
            // Hardcoded university mapping
            let universityName = null;
            let isStudent = false;
            
            // Check if it's a university email
            if (domain.endsWith('.ac.lk')) {
              isStudent = true;
              if (domain === 'cmb.ac.lk') {
                universityName = 'University of Colombo';
              } else if (domain === 'mrt.ac.lk') {
                universityName = 'University of Moratuwa';
              } else if (domain === 'pdn.ac.lk') {
                universityName = 'University of Peradeniya';
              } else if (domain === 'sjp.ac.lk') {
                universityName = 'University of Sri Jayewardenepura';
              } else {
                universityName = 'Unknown University';
              }
            }

            // Create client record
            const client = await Client.create({
              userId: user.id,
              isStudent: isStudent,
              nickName: user.get('name').split(' ')[0]
            });
            
            // If client is a student, create a student record
            if (isStudent && universityName) {
              await Student.create({
                clientId: user.id,
                university: universityName,
                universityEmail: email,
                universityId: `ST${100000 + Math.floor(Math.random() * 900000)}`
              });
            }
          } catch (error) {
            console.error(`Error creating client profile for user ${user.id}:`, error);
          }
        }
      }
      
      console.log('Client profiles created');

      // Create experience records for professional users
      console.log('Creating experience records...');
      
      // Add experiences for counselors
      await Experience.bulkCreate([
        {
          userId: 1,  // Naruto
          company: 'Konoha Mental Health Center',
          position: 'Senior Counselor',
          startDate: new Date('2020-06-01'),
          endDate: null,  // currently working
          description: 'Provide individual and group counseling sessions for clients with various mental health concerns.',
          document: '/uploads/experiences/naruto_exp_konoha_mhc.pdf'
        },
        {
          userId: 1,  // Naruto
          company: 'Leaf Village Trauma Recovery Unit',
          position: 'Trauma Counselor',
          startDate: new Date('2018-03-15'),
          endDate: new Date('2020-05-30'),
          description: 'Specialized in supporting individuals recovering from traumatic experiences.',
          document: '/uploads/experiences/naruto_exp_lvtru.jpg'
        },
        {
          userId: 2,  // Sakura
          company: 'Medical Ninja Academy',
          position: 'Mental Health Therapist',
          startDate: new Date('2019-07-01'),
          endDate: null,  // currently working
          description: 'Providing counseling services focused on stress management and relationship issues.',
          document: '/uploads/experiences/sakura_exp_mna.pdf'
        },
        {
          userId: 3,  // Kakashi
          company: 'ANBU Mental Health Division',
          position: 'Cognitive Behavioral Therapist',
          startDate: new Date('2017-05-10'),
          endDate: new Date('2022-12-31'),
          description: 'Conducted specialized therapy sessions for severe PTSD and grief cases.',
          document: '/uploads/experiences/kakashi_exp_anbu.png'
        },
        {
          userId: 8,  // Orochimaru
          company: 'Sound Village Medical Center',
          position: 'Chief Psychiatrist',
          startDate: new Date('2015-01-15'),
          endDate: null,  // currently working
          description: 'Leading a team of mental health professionals specializing in complex psychiatric cases.',
          document: '/uploads/experiences/orochimaru_exp_svmc.pdf'
        },
        {
          userId: 9,  // Kabuto
          company: 'Hidden Leaf Hospital',
          position: 'Child Psychiatrist',
          startDate: new Date('2018-09-01'),
          endDate: new Date('2023-05-30'),
          description: 'Specialized in diagnosing and treating psychiatric conditions in children and adolescents.',
          document: '/uploads/experiences/kabuto_exp_hlh.jpg'
        }
      ]);

      console.log('Experience records created');

      // Create educational qualification records
      console.log('Creating educational qualification records...');
      
      await EduQualification.bulkCreate([
        {
          userId: 1,  // Naruto
          institution: 'Konoha University',
          degree: 'Master of Psychology',
          field: 'Clinical Psychology',
          startDate: new Date('2016-09-01'),
          endDate: new Date('2018-05-30'),
          grade: 'Distinction',
          document: '/uploads/education/naruto_edu_ku_masters.pdf'
        },
        {
          userId: 1,  // Naruto
          institution: 'Konoha University',
          degree: 'Bachelor of Psychology',
          field: 'Psychology',
          startDate: new Date('2012-09-01'),
          endDate: new Date('2016-05-30'),
          grade: 'First Class Honors',
          document: '/uploads/education/naruto_edu_ku_bachelors.jpg'
        },
        {
          userId: 2,  // Sakura
          institution: 'Medical Academy of Fire Country',
          degree: 'Master of Counseling',
          field: 'Therapeutic Counseling',
          startDate: new Date('2017-09-01'),
          endDate: new Date('2019-06-30'),
          grade: 'High Distinction',
          document: '/uploads/education/sakura_edu_mafc_masters.pdf'
        },
        {
          userId: 3,  // Kakashi
          institution: 'Konoha Institute of Psychology',
          degree: 'PhD in Psychology',
          field: 'Cognitive Behavioral Therapy',
          startDate: new Date('2014-09-01'),
          endDate: new Date('2017-05-30'),
          grade: 'Summa Cum Laude',
          document: '/uploads/education/kakashi_edu_kip_phd.pdf'
        },
        {
          userId: 8,  // Orochimaru
          institution: 'Hidden Sound Medical School',
          degree: 'Doctor of Medicine',
          field: 'Psychiatry',
          startDate: new Date('2010-09-01'),
          endDate: new Date('2014-06-30'),
          grade: 'Highest Distinction',
          document: '/uploads/education/orochimaru_edu_hsms_md.pdf'
        },
        {
          userId: 8,  // Orochimaru
          institution: 'Snake Medical University',
          degree: 'Specialization',
          field: 'Neuropsychiatry',
          startDate: new Date('2014-08-01'),
          endDate: new Date('2015-07-30'),
          grade: 'Excellence',
          document: '/uploads/education/orochimaru_edu_smu_neuro.jpg'
        },
        {
          userId: 9,  // Kabuto
          institution: 'Hidden Leaf Medical University',
          degree: 'Doctor of Medicine',
          field: 'Child Psychiatry',
          startDate: new Date('2014-09-01'),
          endDate: new Date('2018-06-30'),
          grade: 'Distinction',
          document: '/uploads/education/kabuto_edu_hlmu_md.pdf'
        }
      ]);
      
      console.log('Educational qualification records created');

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
    // Continue execution without throwing error to prevent sync from failing
  }
};