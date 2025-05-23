// Update the handleSubmit function in the existing file:

const handleSubmit = async () => {
  try {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        lawyer_id: id,
        user_id: user.id,
        date: selectedDate,
        time: selectedTime,
        type: consultationType,
        notes: notes,
      })
      .select()
      .single();

    if (appointmentError) throw appointmentError;

    // Create a chat for communication
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        lawyer_id: id,
        user_id: user.id,
      })
      .select()
      .single();

    if (chatError) throw chatError;

    // Send initial message about consultation
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chat.id,
        sender_id: user.id,
        content: `Consultation scheduled for ${selectedDate} at ${selectedTime}${notes ? `\n\nNotes: ${notes}` : ''}`
      });

    if (messageError) throw messageError;

    router.push('/appointments');
  } catch (err: any) {
    console.error('Error scheduling consultation:', err);
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};