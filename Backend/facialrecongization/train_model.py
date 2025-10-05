"""
Custom Emotion Recognition Model Training
Uses FER-2013 dataset with focus on sadness classification
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# Emotion labels
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

def load_fer2013(csv_path='fer2013.csv'):
    """
    Load FER-2013 dataset from CSV
    Download from: https://www.kaggle.com/datasets/msambare/fer2013
    """
    print("Loading FER-2013 dataset...")
    df = pd.read_csv(csv_path)
    
    # Parse pixel data
    pixels = df['pixels'].tolist()
    images = np.array([np.fromstring(pixel, dtype=int, sep=' ').reshape(48, 48) 
                       for pixel in pixels])
    
    # Normalize
    images = images / 255.0
    images = images.reshape(-1, 48, 48, 1)
    
    # One-hot encode labels
    labels = keras.utils.to_categorical(df['emotion'], num_classes=7)
    
    return images, labels

def create_emotion_model(input_shape=(48, 48, 1), num_classes=7):
    """
    Create CNN model optimized for emotion recognition with focus on sadness
    """
    model = models.Sequential([
        # Block 1
        layers.Conv2D(64, (3, 3), activation='relu', padding='same', input_shape=input_shape),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 2
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 3
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 4
        layers.Conv2D(512, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(512, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Dense layers
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model

def train_model(csv_path='fer2013.csv', epochs=50, batch_size=64):
    """
    Train the emotion recognition model
    """
    # Load data
    X, y = load_fer2013(csv_path)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=np.argmax(y, axis=1)
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Data augmentation for better generalization
    datagen = ImageDataGenerator(
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
        shear_range=0.1
    )
    datagen.fit(X_train)
    
    # Create model
    model = create_emotion_model()
    
    # Compile with class weights to handle imbalance (emphasize sadness)
    class_weights = {
        0: 1.0,  # angry
        1: 1.5,  # disgust (rare)
        2: 1.2,  # fear
        3: 1.0,  # happy
        4: 1.5,  # sad (IMPORTANT for mental health)
        5: 1.0,  # surprise
        6: 0.8   # neutral (common)
    }
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\nModel Architecture:")
    model.summary()
    
    # Callbacks
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-7),
        ModelCheckpoint('emotion_model_best.h5', monitor='val_accuracy', 
                       save_best_only=True, mode='max')
    ]
    
    # Train
    print("\nStarting training...")
    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=batch_size),
        validation_data=(X_test, y_test),
        epochs=epochs,
        callbacks=callbacks,
        class_weight=class_weights,
        verbose=1
    )
    
    # Evaluate
    print("\nEvaluating model...")
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test accuracy: {test_acc:.4f}")
    print(f"Test loss: {test_loss:.4f}")
    
    # Save final model
    model.save('emotion_model_final.h5')
    print("\nModel saved as 'emotion_model_final.h5'")
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Val Accuracy')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    print("Training history saved as 'training_history.png'")
    
    return model, history

if __name__ == "__main__":
    print("=" * 60)
    print("Mental Health Emotion Recognition Model Training")
    print("=" * 60)
    print("\nIMPORTANT: Download FER-2013 dataset from:")
    print("https://www.kaggle.com/datasets/msambare/fer2013")
    print("Place 'fer2013.csv' in this directory\n")
    
    import os
    if not os.path.exists('fer2013.csv'):
        print("ERROR: fer2013.csv not found!")
        print("Please download the dataset first.")
    else:
        model, history = train_model(epochs=50, batch_size=64)
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
