import { sequelize } from './db';
import User from '../models/User';
import Post from '../models/Post';
import LikePost from '../models/LikePost';
import DislikePost from '../models/DislikePost';
import Counselor from '../models/Counselor';
import Admin from '../models/Admin';
import Client from '../models/Client';
import Psychiatrist from '../models/Psychiatrist';
import MTMember from '../models/MT-member';
import Student from '../models/Student';
import Experience from '../models/Experience';
import EduQualification from '../models/EduQualification';
import Notification from '../models/Notification';
import Review from '../models/Review';
import LikeReview from '../models/LikeReview';
import DislikeReview from '../models/DislikeReview';
import Comment from '../models/Comment';
import LikeComment from '../models/LikeComment';
import DislikeComment from '../models/DislikeComment';
import Session from '../models/Session';
import Complaint from '../models/Complaint';
import Reason from '../models/Reason';
import PaymentTransaction from '../models/PaymentTransaction';

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
            rating: 4.8 + (Math.random() * 0.4 - 0.2), // Random rating between 4.6 and 5.0
            sessionFee: user.id === 3 ? 0.00 : // Kakashi is a volunteer (free)
                       user.id === 1 ? 3500.00 : // Naruto's fee
                       2800.00 // Sakura's fee
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

      // Create notification records
      console.log('Creating notification records...');
      
      const currentDate = new Date();
      // Helper function to create dates relative to current date
      const getRelativeDate = (daysOffset: number): Date => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - daysOffset);
        return date;
      };
      
      await Notification.bulkCreate([
        {
          userId: users[0].id, // Naruto
          type: 'info',
          title: 'New Session Request',
          message: 'You have a new counseling session request from Sasuke Uchiha for tomorrow at 3:00 PM.',
          isRead: true,
          relatedURL: '/sessions/upcoming',
          createdAt: getRelativeDate(5)
        },
        {
          userId: users[0].id, // Naruto
          type: 'success',
          title: 'Certification Approved',
          message: 'Your clinical psychology certification has been reviewed and approved by the administration.',
          isRead: true,
          relatedURL: '/profile/certifications',
          createdAt: getRelativeDate(10)
        },
        {
          userId: users[1].id, // Sakura
          type: 'warning',
          title: 'Session Rescheduled',
          message: 'Your session with Hinata Hyuga on June 25th has been rescheduled to June 26th.',
          isRead: false,
          relatedURL: '/sessions/calendar',
          createdAt: getRelativeDate(2)
        },
        {
          userId: users[2].id, // Kakashi
          type: 'danger',
          title: 'Urgent: System Maintenance',
          message: 'The counseling portal will be unavailable for maintenance on June 30th from 2:00 AM to 4:00 AM.',
          isRead: false,
          relatedURL: null,
          createdAt: getRelativeDate(1)
        },
        {
          userId: users[4].id, // Sasuke (Client)
          type: 'message',
          title: 'Message from Your Counselor',
          message: 'Naruto has shared some resources for your next session. Please review them before our meeting.',
          isRead: false,
          relatedURL: '/messages/inbox/12345',
          createdAt: getRelativeDate(3)
        },
        {
          userId: users[5].id, // Hinata (Client)
          type: 'complaint',
          title: 'Response to Your Feedback',
          message: 'Thank you for your feedback about our services. We have addressed your concerns about the scheduling system.',
          isRead: false,
          relatedURL: '/feedback/responses/67890',
          createdAt: getRelativeDate(7)
        },
        {
          userId: users[7].id, // Orochimaru (Psychiatrist)
          type: 'info',
          title: 'New Medical Guidelines',
          message: 'New guidelines for psychiatric medication management have been published. Please review them at your earliest convenience.',
          isRead: true,
          relatedURL: '/resources/guidelines',
          createdAt: getRelativeDate(4)
        },
        {
          userId: users[10].id, // Jiraiya (MT-member)
          type: 'success',
          title: 'Crisis Intervention Training',
          message: 'You have successfully completed the crisis intervention training program. Certificate is now available.',
          isRead: false,
          relatedURL: '/training/certificates',
          createdAt: getRelativeDate(1)
        }
      ]);
      
      console.log('Notification records created');

      // Create review records
      console.log('Creating review records...');
      
      // Helper function to get a random date within the last year
      const getRandomDate = (): Date => {
        const now = new Date();
        const pastYear = new Date(now);
        pastYear.setFullYear(now.getFullYear() - 1);
        
        const randomTimestamp = pastYear.getTime() + 
            Math.random() * (now.getTime() - pastYear.getTime());
        
        return new Date(randomTimestamp);
      };
      
      const reviews = await Review.bulkCreate([
        {
          rating: 5.0,
          comment: "Naruto was incredibly supportive and understanding during our sessions. He provided practical strategies that have helped me manage my anxiety.",
          userId: users[4].id, // Sasuke (Client)
          counselorId: users[0].id, // Naruto (Counselor)
          createdAt: getRandomDate()
        },
        {
          rating: 4.8,
          comment: "Sakura has a warm and empathetic approach that made me feel comfortable opening up. Her expertise in relationship counseling was evident.",
          userId: users[5].id, // Hinata (Client)
          counselorId: users[1].id, // Sakura (Counselor)
          createdAt: getRandomDate()
        },
        {
          rating: 4.5,
          comment: "Kakashi's methods for dealing with trauma are highly effective. I appreciate his patient and thoughtful guidance.",
          userId: users[6].id, // Shikamaru (Client)
          counselorId: users[2].id, // Kakashi (Counselor)
          createdAt: getRandomDate()
        },
        {
          rating: 4.9,
          comment: "I've made significant progress with Naruto's help. His positive energy and deep understanding of depression have been invaluable to my recovery.",
          userId: users[5].id, // Hinata (Client)
          counselorId: users[0].id, // Naruto (Counselor)
          createdAt: getRandomDate()
        },
        {
          rating: 4.7,
          comment: "Sakura provides clear guidance and practical tools. Our sessions have helped me develop better stress management techniques.",
          userId: users[6].id, // Shikamaru (Client)
          counselorId: users[1].id, // Sakura (Counselor)
          createdAt: getRandomDate()
        }
      ]);
      
      console.log('Review records created');
      
      // Create sample review likes
      console.log('Creating sample review likes...');
      await LikeReview.bulkCreate([
        { userId: users[0].id, reviewId: reviews[0].reviewId }, // Naruto likes Sasuke's review
        { userId: users[1].id, reviewId: reviews[0].reviewId }, // Sakura likes Sasuke's review
        { userId: users[2].id, reviewId: reviews[0].reviewId }, // Kakashi likes Sasuke's review
        { userId: users[0].id, reviewId: reviews[1].reviewId }, // Naruto likes Hinata's review of Sakura
        { userId: users[4].id, reviewId: reviews[1].reviewId }, // Sasuke likes Hinata's review
        { userId: users[1].id, reviewId: reviews[2].reviewId }, // Sakura likes Shikamaru's review of Kakashi
        { userId: users[0].id, reviewId: reviews[3].reviewId }, // Naruto likes Hinata's review of him
        { userId: users[2].id, reviewId: reviews[4].reviewId }, // Kakashi likes Shikamaru's review of Sakura
        { userId: users[0].id, reviewId: reviews[4].reviewId }, // Naruto likes Shikamaru's review of Sakura
      ]);
      
      console.log('Sample review likes created');
      
      // Create sample review dislikes
      console.log('Creating sample review dislikes...');
      await DislikeReview.bulkCreate([
        { userId: users[7].id, reviewId: reviews[0].reviewId }, // Orochimaru dislikes Sasuke's review of Naruto
        { userId: users[3].id, reviewId: reviews[2].reviewId }, // Tsunade dislikes Shikamaru's review of Kakashi
        { userId: users[9].id, reviewId: reviews[4].reviewId }, // Shizune dislikes Shikamaru's review of Sakura
      ]);
      
      console.log('Sample review dislikes created');

      // Create sample counseling sessions
      console.log('Creating sample sessions...');
      
      // Get today's date (June 29, 2025)
      const today = new Date('2025-06-29');
      
      // Helper function to add days to a date
      const addDays = (date: Date, days: number): Date => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      };
      
      await Session.bulkCreate([
        {
          userId: users[4].id, // Sasuke (Client)
          counselorId: users[0].id, // Naruto (Counselor)
          date: addDays(today, 2), // July 1, 2025
          timeSlot: '10:00',
          duration: 50,
          price: 2500.00,
          notes: 'Initial session to discuss anxiety management strategies.',
          status: 'scheduled',
          paymentMethodId: 'pm_card_visa'
        },
        {
          userId: users[5].id, // Hinata (Client)
          counselorId: users[1].id, // Sakura (Counselor)
          date: addDays(today, 3), // July 2, 2025
          timeSlot: '14:30',
          duration: 60,
          price: 3000.00,
          notes: 'Follow-up session on relationship counseling and self-confidence building.',
          status: 'scheduled',
          paymentMethodId: 'pm_card_mastercard'
        },
        {
          userId: users[6].id, // Shikamaru (Client)
          counselorId: users[2].id, // Kakashi (Counselor)
          date: addDays(today, 1), // June 30, 2025
          timeSlot: '16:00',
          duration: 45,
          price: 2000.00,
          notes: 'Session to discuss stress management techniques.',
          status: 'scheduled',
          paymentMethodId: 'pm_card_amex'
        },
        {
          userId: users[4].id, // Sasuke (Client)
          counselorId: users[0].id, // Naruto (Counselor)
          date: addDays(today, -7), // June 22, 2025
          timeSlot: '11:00',
          duration: 50,
          price: 2500.00,
          notes: 'Initial assessment completed. Client showed signs of mild anxiety.',
          status: 'completed',
          paymentMethodId: 'pm_card_visa'
        },
        {
          userId: users[5].id, // Hinata (Client)
          counselorId: users[1].id, // Sakura (Counselor)
          date: addDays(today, -3), // June 26, 2025
          timeSlot: '15:00',
          duration: 30,
          price: 1500.00,
          notes: 'Quick check-in on progress with self-esteem exercises.',
          status: 'completed',
          paymentMethodId: 'pm_card_mastercard'
        },
        {
          userId: users[6].id, // Shikamaru (Client)
          counselorId: users[0].id, // Naruto (Counselor)
          date: addDays(today, -1), // June 28, 2025
          timeSlot: '13:30',
          duration: 60,
          price: 3000.00,
          notes: 'Client requested cancellation due to unexpected work commitment.',
          status: 'cancelled',
          paymentMethodId: 'pm_card_discover'
        },
        {
          userId: users[4].id, // Sasuke (Client)
          counselorId: users[2].id, // Kakashi (Counselor)
          date: addDays(today, 5), // July 4, 2025
          timeSlot: '09:00',
          duration: 45,
          price: 2000.00,
          notes: 'First session with this counselor to address trauma-related issues.',
          status: 'scheduled',
          paymentMethodId: 'pm_card_visa'
        }
      ]);
      
      console.log('Sample sessions created');
      
      // Store session references for complaints
      const sessions = await Session.findAll();
      
      // Create sample complaints
      console.log('Creating sample complaints...');
      
      await Complaint.bulkCreate([
        {
          complaint: 'The counselor was late for our scheduled session and missed 15 minutes of our time.',
          status: 'pending',
          proof: '/uploads/screenshots/session_time_proof.jpg',
          userId: users[4].id, // Sasuke (Client)
          sessionId: sessions[3].id // Completed session with Naruto
        },
        {
          complaint: 'Technical issues during the video session prevented effective communication.',
          status: 'in review',
          proof: null,
          userId: users[5].id, // Hinata (Client)
          sessionId: sessions[4].id // Completed session with Sakura
        },
        {
          complaint: 'The counselor seemed distracted and unprepared for our session.',
          status: 'resolved',
          proof: '/uploads/recordings/session_recording.mp3',
          userId: users[6].id, // Shikamaru (Client)
          sessionId: sessions[5].id // Cancelled session with Naruto
        },
        {
          complaint: 'The session was cut short and I was still charged the full amount.',
          status: 'rejected',
          proof: '/uploads/screenshots/payment_receipt.pdf',
          userId: users[4].id, // Sasuke (Client)
          sessionId: sessions[3].id // Completed session with Naruto
        }
      ]);
      
      console.log('Sample complaints created');
      
      // Create sample reasons
      console.log('Creating sample reasons...');
      
      await Reason.bulkCreate([
        {
          reasonName: 'Inappropriate Content',
          reason: 'This post contains content that violates our community guidelines regarding appropriate content. Posts must not contain offensive language, explicit material, or content that could be deemed harmful.',
          reasonType: 'post_reject'
        },
        {
          reasonName: 'Misleading Information',
          reason: 'This post contains information that may be misleading or factually incorrect regarding mental health conditions or treatments.',
          reasonType: 'post_reject'
        },
        {
          reasonName: 'Account Misuse',
          reason: 'Multiple violations of platform policies have been detected, including inappropriate behavior or harassment.',
          reasonType: 'user_deactivate'
        },
        {
          reasonName: 'Identity Verification Failed',
          reason: 'Unable to verify the professional credentials or identity of the account holder after multiple attempts.',
          reasonType: 'user_deactivate'
        },
        {
          reasonName: 'Insufficient Evidence',
          reason: 'The complaint was rejected due to insufficient evidence supporting the claims made.',
          reasonType: 'complaint_rejected'
        },
        {
          reasonName: 'Out of Scope',
          reason: 'The complaint involves matters outside the scope of what our platform can address or regulate.',
          reasonType: 'complaint_rejected'
        },
        {
          reasonName: 'Professional Emergency',
          reason: 'The professional had to cancel the session due to an emergency situation.',
          reasonType: 'session_cancelled'
        },
        {
          reasonName: 'Technical Difficulties',
          reason: 'The session was cancelled due to persistent technical issues that could not be resolved.',
          reasonType: 'session_cancelled'
        }
      ]);
      
      console.log('Sample reasons created');

      // Create sample payment transactions
      console.log('Creating sample payment transactions...');
      
      await PaymentTransaction.bulkCreate([
        {
          userId: users[4].id, // Sasuke (Client)
          sessionId: sessions[0].id, // Scheduled session with Naruto
          paymentFor: 'session_fee',
          amount: 2500.00,
          currency: 'LKR',
          status: 'success',
          created_at: new Date('2025-06-28T14:30:00')
        },
        {
          userId: users[5].id, // Hinata (Client)
          sessionId: sessions[1].id, // Scheduled session with Sakura
          paymentFor: 'session_fee',
          amount: 3000.00,
          currency: 'LKR',
          status: 'success',
          created_at: new Date('2025-06-29T09:15:00')
        },
        {
          userId: users[6].id, // Shikamaru (Client)
          sessionId: sessions[2].id, // Scheduled session with Kakashi
          paymentFor: 'session_fee',
          amount: 2000.00,
          currency: 'LKR',
          status: 'success',
          created_at: new Date('2025-06-29T16:45:00')
        },
        {
          userId: users[4].id, // Sasuke (Client)
          sessionId: sessions[3].id, // Completed session with Naruto
          paymentFor: 'session_fee',
          amount: 2500.00,
          currency: 'LKR',
          status: 'success',
          created_at: new Date('2025-06-22T10:20:00')
        },
        {
          userId: users[5].id, // Hinata (Client)
          sessionId: sessions[4].id, // Completed session with Sakura
          paymentFor: 'session_fee',
          amount: 1500.00,
          currency: 'LKR',
          status: 'success',
          created_at: new Date('2025-06-26T14:50:00')
        },
        {
          userId: users[6].id, // Shikamaru (Client)
          sessionId: sessions[5].id, // Cancelled session with Naruto
          paymentFor: 'session_fee',
          amount: 3000.00,
          currency: 'LKR',
          status: 'failed', // Payment failed (perhaps why it was cancelled)
          created_at: new Date('2025-06-27T12:30:00')
        },
        {
          userId: users[4].id, // Sasuke (Client)
          sessionId: null, // Platform fee not tied to a specific session
          paymentFor: 'platform_fee',
          amount: 500.00,
          currency: 'LKR',
          status: 'success',
          created_at: new Date('2025-06-15T08:00:00')
        },
        {
          userId: users[5].id, // Hinata (Client)
          sessionId: null, // Platform fee not tied to a specific session
          paymentFor: 'platform_fee',
          amount: 500.00,
          currency: 'LKR',
          status: 'success',
          created_at: new Date('2025-06-20T11:45:00')
        }
      ]);
      
      console.log('Sample payment transactions created');

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

      // Create sample post likes
      console.log('Creating sample post likes...');
      await LikePost.bulkCreate([
        { userId: users[1].id, postId: posts[0].id }, // Sakura likes Naruto's post
        { userId: users[2].id, postId: posts[0].id }, // Kakashi likes Naruto's post
        { userId: users[0].id, postId: posts[1].id }, // Naruto likes Sakura's post
        { userId: users[2].id, postId: posts[1].id }, // Kakashi likes Sakura's post
        { userId: users[0].id, postId: posts[2].id }, // Naruto likes Kakashi's post
        { userId: users[1].id, postId: posts[2].id }, // Sakura likes Kakashi's post
      ]);

      console.log('Sample post likes created');
      
      // Create sample post dislikes
      console.log('Creating sample post dislikes...');
      await DislikePost.bulkCreate([
        { userId: users[6].id, postId: posts[0].id }, // Shikamaru dislikes Naruto's post
        { userId: users[4].id, postId: posts[1].id }, // Sasuke dislikes Sakura's post
        { userId: users[4].id, postId: posts[2].id }, // Sasuke dislikes Kakashi's post
        { userId: users[5].id, postId: posts[2].id }, // Hinata dislikes Kakashi's post (probably because he's reading questionable literature)
      ]);
      
      console.log('Sample post dislikes created');
      
      // Create sample comments and replies
      console.log('Creating sample comments...');
      
      // Comments on Naruto's post about ramen
      const comment1 = await Comment.create({
        userId: users[1].id, // Sakura
        postId: posts[0].id, // Naruto's post
        content: "Always thinking about ramen, aren't you? 🍜 But I agree, Ichiraku is the best! Maybe I'll join you next time.",
        likes: 8
      });
      
      const comment2 = await Comment.create({
        userId: users[5].id, // Hinata
        postId: posts[0].id, // Naruto's post
        content: "I'm glad Ichiraku brings you such joy, Naruto-kun! Small comforts are important for mental well-being.",
        likes: 12
      });
      
      // Reply to Sakura's comment
      await Comment.create({
        userId: users[0].id, // Naruto
        postId: posts[0].id, // Naruto's post
        parentId: comment1.id, // Reply to Sakura's comment
        content: "You're welcome to join anytime, Sakura-chan! The more the merrier! 😁",
        likes: 5
      });
      
      // Reply to Hinata's comment
      await Comment.create({
        userId: users[0].id, // Naruto
        postId: posts[0].id, // Naruto's post
        parentId: comment2.id, // Reply to Hinata's comment
        content: "Thanks Hinata! Would you like to join me next time? They added a new vegetable ramen that you might like!",
        likes: 7
      });
      
      // Another reply to Hinata's comment (nested)
      await Comment.create({
        userId: users[5].id, // Hinata
        postId: posts[0].id, // Naruto's post
        parentId: comment2.id, // Reply to Hinata's own comment
        content: "I would love to! Thank you for the invitation. 😊",
        likes: 6
      });
      
      // Comments on Sakura's post
      const comment3 = await Comment.create({
        userId: users[0].id, // Naruto
        postId: posts[1].id, // Sakura's post
        content: "Hey! It's not my fault I get injured during training! 😤 But those medical techniques sound awesome, Sakura-chan!",
        likes: 9
      });
      
      await Comment.create({
        userId: users[3].id, // Tsunade
        postId: posts[1].id, // Sakura's post
        content: "You're making excellent progress, Sakura. Keep up the good work and continue practicing those techniques we discussed.",
        likes: 15
      });
      
      // Reply to Naruto's comment
      await Comment.create({
        userId: users[1].id, // Sakura
        postId: posts[1].id, // Sakura's post
        parentId: comment3.id, // Reply to Naruto's comment
        content: "Maybe if you were more careful, you wouldn't need healing so often! 🙄 But thanks, I'm really enjoying the training.",
        likes: 11
      });
      
      // Comments on Kakashi's post
      await Comment.create({
        userId: users[0].id, // Naruto
        postId: posts[2].id, // Kakashi's post
        content: "Sensei! What are you reading? Can I join you? I promise I'll be quiet! 😁",
        likes: 6
      });
      
      const comment4 = await Comment.create({
        userId: users[1].id, // Sakura
        postId: posts[2].id, // Kakashi's post
        content: "Kakashi-sensei, we all know what book you're reading... 😑",
        likes: 14
      });
      
      // Reply to Sakura's comment
      await Comment.create({
        userId: users[2].id, // Kakashi
        postId: posts[2].id, // Kakashi's post
        parentId: comment4.id, // Reply to Sakura's comment
        content: "It's literature... sophisticated literature. You wouldn't understand. *continues reading*",
        likes: 18
      });
      
      console.log('Sample comments created');
      
      // Create sample comment likes
      console.log('Creating sample comment likes...');
      await LikeComment.bulkCreate([
        { userId: users[0].id, commentId: comment1.id }, // Naruto likes Sakura's comment
        { userId: users[2].id, commentId: comment1.id }, // Kakashi likes Sakura's comment
        { userId: users[0].id, commentId: comment2.id }, // Naruto likes Hinata's comment
        { userId: users[1].id, commentId: comment2.id }, // Sakura likes Hinata's comment
        { userId: users[4].id, commentId: comment2.id }, // Sasuke likes Hinata's comment
        { userId: users[1].id, commentId: comment3.id }, // Sakura likes Naruto's comment
        { userId: users[5].id, commentId: comment3.id }, // Hinata likes Naruto's comment
        { userId: users[0].id, commentId: comment4.id }, // Naruto likes Sakura's comment to Kakashi
        { userId: users[5].id, commentId: comment4.id }, // Hinata likes Sakura's comment to Kakashi
        { userId: users[6].id, commentId: comment4.id }, // Shikamaru likes Sakura's comment to Kakashi
      ]);
      
      console.log('Sample comment likes created');
      
      // Create sample comment dislikes
      console.log('Creating sample comment dislikes...');
      await DislikeComment.bulkCreate([
        { userId: users[4].id, commentId: comment1.id }, // Sasuke dislikes Sakura's comment
        { userId: users[6].id, commentId: comment3.id }, // Shikamaru dislikes Naruto's comment
        { userId: users[2].id, commentId: comment4.id }, // Kakashi dislikes Sakura's comment about his book
      ]);
      
      console.log('Sample comment dislikes created');
    }
  } catch (error) {
    console.error('Error creating sample data:', error);
    // Continue execution without throwing error to prevent sync from failing
  }
};