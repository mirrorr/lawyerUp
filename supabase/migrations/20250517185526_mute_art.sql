/*
  # Insert sample lawyers

  This migration adds initial lawyer data to populate the application.
  
  1. Data Added
    - 4 lawyers with diverse specialties and backgrounds
    - Each lawyer has complete profile information
    - Professional stock photos from Pexels
*/

INSERT INTO lawyers (name, specialty, rating, reviews_count, image_url, location, experience, languages, education, consultation_fee, availability, about)
VALUES
  (
    'Sarah Johnson',
    'Criminal Law',
    4.8,
    127,
    'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg',
    'New York, NY',
    '15 years',
    ARRAY['English', 'Spanish'],
    'Harvard Law School',
    '$200/hour',
    'Mon-Fri, 9AM-5PM',
    'Specializing in criminal defense with a proven track record of successful cases. Dedicated to providing aggressive representation while maintaining the highest ethical standards.'
  ),
  (
    'Michael Chen',
    'Corporate Law',
    4.9,
    89,
    'https://images.pexels.com/photos/5668770/pexels-photo-5668770.jpeg',
    'San Francisco, CA',
    '12 years',
    ARRAY['English', 'Mandarin'],
    'Stanford Law School',
    '$250/hour',
    'Mon-Fri, 8AM-6PM',
    'Expert in corporate law and business transactions. Helping companies navigate complex legal challenges and achieve their business objectives.'
  ),
  (
    'Emily Rodriguez',
    'Family Law',
    4.7,
    156,
    'https://images.pexels.com/photos/7089629/pexels-photo-7089629.jpeg',
    'Chicago, IL',
    '10 years',
    ARRAY['English', 'Spanish'],
    'University of Chicago Law School',
    '$180/hour',
    'Mon-Fri, 9AM-6PM',
    'Compassionate family law attorney focusing on divorce, custody, and adoption cases. Committed to achieving the best outcomes for families in transition.'
  ),
  (
    'David Kim',
    'Immigration',
    4.9,
    92,
    'https://images.pexels.com/photos/8434891/pexels-photo-8434891.jpeg',
    'Los Angeles, CA',
    '8 years',
    ARRAY['English', 'Korean'],
    'UCLA School of Law',
    '$190/hour',
    'Mon-Sat, 8AM-7PM',
    'Dedicated immigration attorney helping individuals and families achieve their American dream. Experienced in all aspects of immigration law including visas, green cards, and citizenship.'
  );